import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. 내 알림 목록 조회 (최신순)
  async getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 2. 알림 읽음 처리
  async markAsRead(id: string, userId: string) {
    // 내 알림이 맞는지 확인
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error('알림을 찾을 수 없습니다.');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // 3. (테스트용) 알림 생성
  async createNotification(userId: string, title: string, body: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type: 'SYSTEM',
      },
    });
  }
}