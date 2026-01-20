import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CARE_QUESTIONS } from './care-questions.data';

@Injectable()
export class CareService {
  constructor(private readonly prisma: PrismaService) { }

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

  // 2. 오늘 체크인 (도장 찍기) - upsert 방식
  async checkIn(petId: string, checkInDto?: { questions?: any; answers?: any }) {
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

  // 4. 질문 데이터 조회
  async getQuestions() {
    return CARE_QUESTIONS;
  }

  // 5. 특정 날짜의 케어 로그 조회
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