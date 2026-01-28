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

  // 3. 진단 기록 (diagQuestions, diagAnswers 저장) - upsert 방식 + DynamoDB 저장
  async diag(petId: string, diagDto?: { diagQuestions?: any; diagAnswers?: any }) {
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

    // 2. DynamoDB DiagnosticTable에 answers 저장
    try {
      await this.saveDiagToDynamoDB(petId, dateString, diagDto);
    } catch (error) {
      this.logger.error(`Failed to save diag to DynamoDB: ${error}`);
      // DynamoDB 저장 실패해도 PostgreSQL 저장은 성공으로 처리
    }

    return result;
  }

  // DynamoDB DiagnosticTable에 진단 답변 저장
  private async saveDiagToDynamoDB(
    petId: string,
    dateString: string,
    diagDto?: { diagQuestions?: any; diagAnswers?: any },
  ) {
    const tableName = process.env.AWS_DYNAMODB_DIAGNOSTIC_TABLE_NAME;
    if (!tableName) {
      this.logger.warn('AWS_DYNAMODB_DIAGNOSTIC_TABLE_NAME not configured');
      return;
    }

    const diagQuestions = diagDto?.diagQuestions || [];
    const diagAnswers = diagDto?.diagAnswers || {};

    // answers 배열 생성: [{q: 질문, a: 답변}, ...]
    const answersArray: { q: string; a: string }[] = diagQuestions.map((question: any) => {
      const answerValue = diagAnswers[question.id] || '';
      // 선택된 옵션의 label 찾기
      const selectedOption = question.options?.find((opt: any) => opt.value === answerValue);
      return {
        q: question.text || '',
        a: selectedOption?.label || answerValue,
      };
    });

    // 기존 항목 업데이트
    await this.dynamoDBService.updateItem({
      TableName: tableName,
      Key: {
        PK: { S: petId },
        SK: { S: `DATE#${dateString}` },
      },
      UpdateExpression: 'SET answers = :answers, answered_at = :answered_at',
      ExpressionAttributeValues: {
        ':answers': {
          L: answersArray.map((item) => ({
            M: {
              q: { S: item.q },
              a: { S: item.a },
            },
          })),
        },
        ':answered_at': { S: new Date().toISOString() },
      },
    });

    this.logger.log(`Saved diag answers to DynamoDB for petId: ${petId}, date: ${dateString}`);
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

  // 7. 진단 질문 조회 (DynamoDB DiagnosticTable에서 - 당일 데이터)
  async getDiagQuestionsFromDynamoDB(petId: string) {
    try {
      const tableName = process.env.AWS_DYNAMODB_DIAGNOSTIC_TABLE_NAME;
      if (!tableName) {
        this.logger.warn('AWS_DYNAMODB_DIAGNOSTIC_TABLE_NAME not configured');
        return [];
      }

      // 오늘 날짜 (KST)
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstDate = new Date(now.getTime() + kstOffset);
      const todayString = kstDate.toISOString().split('T')[0];
      const todaySK = `DATE#${todayString}`;

      // DynamoDB에서 해당 petId + 당일 SK로 조회
      const items = await this.dynamoDBService.query({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': { S: petId },
          ':sk': { S: todaySK },
        },
      });

      if (!items || items.length === 0) {
        this.logger.log(`No diagnostic data found for petId: ${petId}, date: ${todayString}`);
        return [];
      }

      const latestItem = items[0];
      const generatedQuestionsRaw = latestItem.generated_questions?.L;

      if (!generatedQuestionsRaw || generatedQuestionsRaw.length === 0) {
        this.logger.log(`No generated_questions found for petId: ${petId}`);
        return [];
      }

      // DynamoDB 형식을 파싱하여 프론트엔드에서 사용할 수 있는 형식으로 변환 (모든 질문)
      const questions = generatedQuestionsRaw.map((item: any, index: number) => {
        const questionData = item.M;
        const questionText = questionData?.question?.S || '';
        const optionsData = questionData?.options?.M || {};

        // options 파싱
        const options = Object.entries(optionsData).map(([label, optionValue]: [string, any]) => {
          const optionData = optionValue.M || {};
          return {
            label,
            value: label,
            relatedSymptom: optionData.related_symptom?.S || '',
            signal: optionData.signal?.S || '',
          };
        });

        return {
          id: `diag_q${index + 1}`,
          text: questionText,
          type: 'single',
          options,
        };
      });

      this.logger.log(`Fetched ${questions.length} diag questions for petId: ${petId}`);
      return questions;
    } catch (error) {
      this.logger.error(`Failed to fetch diag questions from DynamoDB: ${error}`);
      return [];
    }
  }

  // 8. 월간 케어 통계 조회 (핵심 지표)
  async getMonthlyStats(petId: string, year: string, month: string) {
    const searchPrefix = `${year}-${month.padStart(2, '0')}`;

    const logs = await this.prisma.careLog.findMany({
      where: {
        petId,
        date: { startsWith: searchPrefix },
      },
      select: {
        date: true,
        answers: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // 통계 계산
    const stats = {
      totalDays: logs.length,
      food: { normal: 0, less: 0, more: 0, none: 0 },
      water: { normal: 0, less: 0, more: 0, none: 0 },
      stool: { normal: 0, less: 0, more: 0, none: 0, diarrhea: 0 },
      urine: { normal: 0, less: 0, more: 0, none: 0 },
      weights: [] as number[],
      latestWeight: null as number | null,
    };

    // 일별 데이터 (그래프용)
    const dailyData: {
      date: string;
      day: number;
      food: number;
      water: number;
      stool: number;
      urine: number;
      weight: number | null;
      foodLabel: string;
      waterLabel: string;
      stoolLabel: string;
      urineLabel: string;
    }[] = [];

    // 값을 숫자로 변환하는 헬퍼 함수
    const valueToScore = (value: string | undefined, type: string): number => {
      if (!value) return 50; // 기본값

      // 식사량/배변량/배뇨량
      if (type === 'food' || type === 'stool' || type === 'urine') {
        if (value === 'none' || value === '안 먹음' || value === '없음') return 0;
        if (value === 'less' || value === '평소보다 적게') return 30;
        if (value === 'normal' || value === '평소만큼') return 50;
        if (value === 'more' || value === '평소보다 많이') return 70;
        if (value === 'diarrhea' || value === '설사') return 20;
      }

      // 음수량
      if (type === 'water') {
        if (value === 'none' || value === '거의 안 마심') return 0;
        if (value === 'less' || value === '평소보다 적음') return 30;
        if (value === 'normal' || value === '평소 수준') return 50;
        if (value === 'more' || value === '평소보다 많음') return 70;
      }

      return 50;
    };

    // 값을 한글 레이블로 변환하는 헬퍼 함수
    const valueToLabel = (value: string | undefined, type: string): string => {
      if (!value) return '기록 없음';

      // 이미 한글이면 그대로 반환
      if (value === '평소만큼' || value === '평소보다 적게' || value === '평소보다 많이' ||
        value === '안 먹음' || value === '없음' || value === '설사' ||
        value === '평소 수준' || value === '평소보다 적음' || value === '평소보다 많음' ||
        value === '거의 안 마심') {
        return value;
      }

      // 영문 value를 한글로 변환
      if (type === 'food') {
        if (value === 'none') return '안 먹음';
        if (value === 'less') return '평소보다 적게';
        if (value === 'normal') return '평소만큼';
        if (value === 'more') return '평소보다 많이';
      }

      if (type === 'water') {
        if (value === 'none') return '거의 안 마심';
        if (value === 'less') return '평소보다 적음';
        if (value === 'normal') return '평소 수준';
        if (value === 'more') return '평소보다 많음';
      }

      if (type === 'stool') {
        if (value === 'none') return '없음';
        if (value === 'less') return '평소보다 적게';
        if (value === 'normal') return '평소만큼';
        if (value === 'more') return '평소보다 많이';
        if (value === 'diarrhea') return '설사';
      }

      if (type === 'urine') {
        if (value === 'none') return '없음';
        if (value === 'less') return '평소보다 적게';
        if (value === 'normal') return '평소만큼';
        if (value === 'more') return '평소보다 많이';
      }

      return value; // 변환 실패 시 원본 반환
    };

    logs.forEach((log) => {
      const answers = log.answers as Record<string, string> | null;
      const day = parseInt(log.date.split('-')[2], 10);

      // 일별 데이터 추가
      const dayData = {
        date: log.date,
        day,
        food: valueToScore(answers?.['q1_food_intake'], 'food'),
        water: valueToScore(answers?.['q2_water_intake'], 'water'),
        stool: valueToScore(answers?.['q4_poop'], 'stool'),
        urine: valueToScore(answers?.['q5_urine'], 'urine'),
        weight: null as number | null,
        foodLabel: valueToLabel(answers?.['q1_food_intake'], 'food'),
        waterLabel: valueToLabel(answers?.['q2_water_intake'], 'water'),
        stoolLabel: valueToLabel(answers?.['q4_poop'], 'stool'),
        urineLabel: valueToLabel(answers?.['q5_urine'], 'urine'),
      };

      if (answers?.['q3_weight']) {
        const weightNum = parseFloat(answers['q3_weight']);
        if (!isNaN(weightNum)) {
          dayData.weight = weightNum;
        }
      }

      dailyData.push(dayData);

      if (!answers) return;

      // 식사량
      const food = answers['q1_food_intake'];
      if (food === 'normal' || food === '평소만큼') stats.food.normal++;
      else if (food === 'less' || food === '평소보다 적게') stats.food.less++;
      else if (food === 'more' || food === '평소보다 많이') stats.food.more++;
      else if (food === 'none' || food === '안 먹음') stats.food.none++;

      // 음수량
      const water = answers['q2_water_intake'];
      if (water === 'normal' || water === '평소 수준') stats.water.normal++;
      else if (water === 'less' || water === '평소보다 적음') stats.water.less++;
      else if (water === 'more' || water === '평소보다 많음') stats.water.more++;
      else if (water === 'none' || water === '거의 안 마심') stats.water.none++;

      // 체중
      const weight = answers['q3_weight'];
      if (weight) {
        const weightNum = parseFloat(weight);
        if (!isNaN(weightNum)) {
          stats.weights.push(weightNum);
          stats.latestWeight = weightNum;
        }
      }

      // 배변량
      const stool = answers['q4_poop'];
      if (stool === 'normal' || stool === '평소만큼') stats.stool.normal++;
      else if (stool === 'less' || stool === '평소보다 적게') stats.stool.less++;
      else if (stool === 'more' || stool === '평소보다 많이') stats.stool.more++;
      else if (stool === 'none' || stool === '없음') stats.stool.none++;
      else if (stool === 'diarrhea' || stool === '설사') stats.stool.diarrhea++;

      // 배뇨량
      const urine = answers['q5_urine'];
      if (urine === 'normal' || urine === '평소만큼') stats.urine.normal++;
      else if (urine === 'less' || urine === '평소보다 적게') stats.urine.less++;
      else if (urine === 'more' || urine === '평소보다 많이') stats.urine.more++;
      else if (urine === 'none' || urine === '없음') stats.urine.none++;
    });

    // 체중 변화 계산
    let weightChange = null;
    if (stats.weights.length >= 2) {
      const firstWeight = stats.weights[0];
      const lastWeight = stats.weights[stats.weights.length - 1];
      weightChange = lastWeight - firstWeight;
    }

    return {
      totalDays: stats.totalDays,
      food: stats.food,
      water: stats.water,
      stool: stats.stool,
      urine: stats.urine,
      latestWeight: stats.latestWeight,
      weightChange,
      avgWeight: stats.weights.length > 0
        ? Math.round((stats.weights.reduce((a, b) => a + b, 0) / stats.weights.length) * 100) / 100
        : null,
      dailyData, // 일별 데이터 추가
    };
  }

  // 9. 일일 리포트 조회 (DynamoDB DiagnosticTable final_report)
  async getDailyReports(petId: string) {
    try {
      const tableName = process.env.AWS_DYNAMODB_DIAGNOSTIC_TABLE_NAME;
      if (!tableName) {
        this.logger.warn('AWS_DYNAMODB_DIAGNOSTIC_TABLE_NAME not configured');
        return [];
      }

      // DynamoDB에서 해당 petId의 모든 데이터 조회 (최신순)
      const items = await this.dynamoDBService.query({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': { S: petId },
        },
        ScanIndexForward: false, // SK 내림차순 (최신 먼저)
      });

      if (!items || items.length === 0) {
        this.logger.log(`No diagnostic data found for petId: ${petId}`);
        return [];
      }

      // final_report가 있는 항목만 필터링하고 변환
      const reports = items
        .filter((item: any) => item.final_report?.S)
        .map((item: any) => {
          const sk = item.SK?.S || '';
          // SK 형식: DATE#2025-01-21
          const dateMatch = sk.match(/DATE#(\d{4}-\d{2}-\d{2})/);
          const date = dateMatch ? dateMatch[1] : '';

          const finalReport = item.final_report?.S || '';
          const createdAt = item.created_at?.S || item.answered_at?.S || '';

          // 날짜 포맷 (MM월 DD일)
          let dateLabel = date;
          if (date) {
            const reportDate = new Date(date);
            dateLabel = reportDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
          }

          // 리포트 요약 (마크다운 제거 후 앞 50자)
          const cleanReport = finalReport
            .replace(/#{1,6}\s*/g, '') // 헤더 제거
            .replace(/\*\*([^*]+)\*\*/g, '$1') // 볼드 제거
            .replace(/\*([^*]+)\*/g, '$1') // 이탤릭 제거
            .replace(/`([^`]+)`/g, '$1') // 인라인 코드 제거
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크 제거
            .replace(/^[-*+]\s+/gm, '') // 리스트 마커 제거
            .replace(/^\d+\.\s+/gm, '') // 숫자 리스트 제거
            .replace(/>\s*/g, '') // 인용문 제거
            .replace(/\n+/g, ' ') // 줄바꿈을 공백으로
            .trim();
          const summary = cleanReport.length > 50
            ? cleanReport.substring(0, 50) + '...'
            : cleanReport;

          // 상태 결정 (리포트 내용 기반 간단한 분석)
          let status: 'normal' | 'caution' | 'check' = 'normal';
          const lowerReport = finalReport.toLowerCase();
          if (lowerReport.includes('주의') || lowerReport.includes('감소') || lowerReport.includes('변화')) {
            status = 'caution';
          }
          if (lowerReport.includes('확인') || lowerReport.includes('병원') || lowerReport.includes('위험')) {
            status = 'check';
          }

          return {
            id: date,
            date,
            dateLabel,
            status,
            summary,
            fullReport: finalReport,
            createdAt,
          };
        });

      this.logger.log(`Fetched ${reports.length} daily reports for petId: ${petId}`);
      return reports;
    } catch (error) {
      this.logger.error(`Failed to fetch daily reports from DynamoDB: ${error}`);
      return [];
    }
  }

  // Admin용: 전체 케어 로그 조회
  async getAllCareLogs() {
    return this.prisma.careLog.findMany({
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 100, // 최근 100개만
    });
  }

  // Admin용: 특정 고양이의 케어 로그 조회
  async getCareLogsByPet(petId: string) {
    return this.prisma.careLog.findMany({
      where: { petId },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }
}