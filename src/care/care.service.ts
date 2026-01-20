import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DynamoDBService } from '../aws/dynamodb.service';
import { CARE_QUESTIONS } from './care-questions.data';

@Injectable()
export class CareService {
  private readonly logger = new Logger(CareService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamoDBService: DynamoDBService,
  ) { }

  // 1. 월간 케어 기록 조회 (캘린더용)
  async getMonthlyCare(petId: string, year: string, month: string) {
    const searchPrefix = `${year}-${month.padStart(2, '0')}`;

    const logs = await this.prisma.careLog.findMany({
      where: {
        petId,
        date: { startsWith: searchPrefix },
      },
      select: { date: true },
    });

    const completedDays = logs.map((log) => log.date);

    return {
      completedDays,
    };
  }

  // 2. 오늘 체크인 (도장 찍기) - upsert 방식 + DynamoDB 저장
  async checkIn(petId: string, checkInDto?: { questions?: any; answers?: any }) {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
    const kstDate = new Date(now.getTime() + kstOffset);
    const dateString = kstDate.toISOString().split('T')[0];

    // 1. PostgreSQL에 upsert
    const result = await this.prisma.careLog.upsert({
      where: {
        petId_date: {
          petId,
          date: dateString,
        },
      },
      update: {
        questions: checkInDto?.questions || null,
        answers: checkInDto?.answers || null,
        type: 'checkin',
      },
      create: {
        petId,
        date: dateString,
        type: 'checkin',
        questions: checkInDto?.questions || null,
        answers: checkInDto?.answers || null,
      },
    });

    // 2. DynamoDB에도 저장
    try {
      await this.saveToDynamoDB(petId, dateString, checkInDto);
    } catch (error) {
      this.logger.error(`Failed to save to DynamoDB: ${error}`);
      // DynamoDB 저장 실패해도 PostgreSQL 저장은 성공으로 처리
    }

    return result;
  }

  // DynamoDB에 데일리 기록 저장
  private async saveToDynamoDB(
    petId: string,
    dateString: string,
    checkInDto?: { questions?: any; answers?: any },
  ) {
    const tableName = process.env.AWS_DYNAMODB_DAILY_RECORD_TABLE_NAME;
    if (!tableName) {
      this.logger.warn('AWS_DYNAMODB_DAILY_RECORD_TABLE_NAME not configured');
      return;
    }

    const answers = checkInDto?.answers || {};
    const questions = checkInDto?.questions || [];

    // 답변에서 각 필드 추출 (label 값으로 저장)
    const getAnswerLabel = (questionId: string): string => {
      const answerValue = answers[questionId];
      if (!answerValue) return '';

      // questions 배열에서 해당 질문 찾기
      const question = questions.find((q: any) => q.id === questionId);
      if (question?.options) {
        const option = question.options.find((opt: any) => opt.value === answerValue);
        if (option?.label) return option.label;
      }
      return answerValue;
    };

    // 6번째 질문 (q6_custom) 처리 - additional_info로 저장
    const additionalInfo: { q: string; a: string }[] = [];
    const customQuestion = questions.find((q: any) => q.id === 'q6_custom');
    if (customQuestion && answers['q6_custom']) {
      additionalInfo.push({
        q: customQuestion.text || '',
        a: getAnswerLabel('q6_custom'),
      });
    }

    const item: Record<string, any> = {
      PK: { S: petId },
      SK: { S: `DATE#${dateString}` },
      created_at: { S: new Date().toISOString() },
      food: { S: getAnswerLabel('q1_food_intake') },
      water: { S: getAnswerLabel('q2_water_intake') },
      weight: { S: answers['q3_weight'] || '' },
      stool: { S: getAnswerLabel('q4_poop') },
      urine: { S: getAnswerLabel('q5_urine') },
    };

    // additional_info가 있으면 추가
    if (additionalInfo.length > 0) {
      item.additional_info = {
        L: additionalInfo.map((info) => ({
          M: {
            q: { S: info.q },
            a: { S: info.a },
          },
        })),
      };
    }

    await this.dynamoDBService.putItem(tableName, item);
    this.logger.log(`Saved daily record to DynamoDB for petId: ${petId}, date: ${dateString}`);
  }

  // 3. 진단 기록 (diagQuestions, diagAnswers 저장) - upsert 방식
  async diag(petId: string, diagDto?: { diagQuestions?: any; diagAnswers?: any }) {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
    const kstDate = new Date(now.getTime() + kstOffset);
    const dateString = kstDate.toISOString().split('T')[0];

    // upsert: 있으면 업데이트, 없으면 생성
    return await this.prisma.careLog.upsert({
      where: {
        petId_date: {
          petId,
          date: dateString,
        },
      },
      update: {
        diagQuestions: diagDto?.diagQuestions || null,
        diagAnswers: diagDto?.diagAnswers || null,
        type: 'diag',
      },
      create: {
        petId,
        date: dateString,
        type: 'diag',
        diagQuestions: diagDto?.diagQuestions || null,
        diagAnswers: diagDto?.diagAnswers || null,
      },
    });
  }

  // 4. 질문 데이터 조회 (기본)
  async getQuestions() {
    return CARE_QUESTIONS;
  }

  // 5. petId별 맞춤 질문 조회 (DynamoDB question_bank 포함)
  async getQuestionsForPet(petId: string) {
    const baseQuestions = { ...CARE_QUESTIONS } as any;

    try {
      // DynamoDB에서 해당 petId의 가장 최근 데이터 조회
      const tableName = process.env.AWS_DYNAMODB_UPDATED_TABLE_NAME;
      if (!tableName) {
        this.logger.warn('AWS_DYNAMODB_UPDATED_TABLE_NAME not configured');
        return baseQuestions;
      }

      const items = await this.dynamoDBService.query({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': { S: petId },
        },
        ScanIndexForward: false, // SK 내림차순 (최신 먼저)
        Limit: 1,
      });

      if (!items || items.length === 0) {
        this.logger.log(`No DynamoDB data found for petId: ${petId}`);
        return baseQuestions;
      }

      const latestItem = items[0];
      const questionBankRaw = latestItem.question_bank?.L;

      if (!questionBankRaw || questionBankRaw.length === 0) {
        this.logger.log(`No question_bank found for petId: ${petId}`);
        return baseQuestions;
      }

      // question_bank에서 랜덤으로 하나 선택
      const randomIndex = Math.floor(Math.random() * questionBankRaw.length);
      const randomQuestionText = questionBankRaw[randomIndex]?.S;

      if (randomQuestionText) {
        // 6번째 질문으로 추가
        const customQuestion = {
          id: 'q6_custom',
          text: randomQuestionText,
          description: '오늘의 맞춤 질문이에요.',
          type: 'yesno',
          options: [
            { value: 'yes', label: '예', score: 1 },
            { value: 'no', label: '아니오', score: 0 },
            { value: 'unknown', label: '잘 모르겠어요', score: 0 },
          ],
          category: 'DAILY',
        };

        baseQuestions.onboarding.q6_custom = customQuestion;
        this.logger.log(`Added custom question for petId: ${petId}`);
      }

      return baseQuestions;
    } catch (error) {
      this.logger.error(`Failed to fetch question_bank from DynamoDB: ${error}`);
      return baseQuestions;
    }
  }

  // 6. 특정 날짜의 케어 로그 조회
  async getCareLogByDate(petId: string, date: string) {
    const log = await this.prisma.careLog.findUnique({
      where: {
        petId_date: {
          petId,
          date,
        },
      },
    });

    return log;
  }
}