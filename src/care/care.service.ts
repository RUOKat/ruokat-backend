import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CareService {
  constructor(private readonly prisma: PrismaService) {}

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

  // 2. 오늘 체크인 (도장 찍기)
  async checkIn(petId: string) {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
    const kstDate = new Date(now.getTime() + kstOffset);
    const dateString = kstDate.toISOString().split('T')[0];

    try {
      return await this.prisma.careLog.create({
        data: {
          petId,
          date: dateString,
          type: 'checkin',
        },
      });
    } catch (error) {
      // 💡 [수정] (error as any)를 붙여서 타입 에러 해결!
      if ((error as any).code === 'P2002') {
        throw new ConflictException('이미 오늘 체크인을 완료했습니다.');
      }
      throw error;
    }
  }
}