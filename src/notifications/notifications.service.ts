import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExpoService } from 'src/expo/expo.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly expoService: ExpoService,
  ) { }

  // 1. 내 알림 목록 조회 (최신순)
  async getMyNotifications(sub: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.prisma.notification.findMany({
      where: {
        user: { sub: sub },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 2. 알림 읽음 처리
  async markAsRead(id: string, sub: string) {
    // 내 알림이 맞는지 확인
    const notification = await this.prisma.notification.findFirst({
      where: { id, user: { sub } },
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
  async createNotification(sub: string, title: string, body: string) {
    const user = await this.prisma.user.findUnique({ where: { sub } });
    if (!user) {
      throw new Error('유저를 찾을 수 없습니다.');
    }
    const userId = user.id;
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type: 'SYSTEM',
      },
    });
  }

  // 4. 알림 삭제
  async remove(id: string, sub: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, user: { sub } },
    });

    if (!notification) {
      throw new Error('알림을 찾을 수 없습니다.');
    }

    return this.prisma.notification.delete({
      where: { id },
    });
  }

  // 5. 푸시 알림 전송 및 DB 저장
  async sendPushNotification(
    userId: string,
    pushToken: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, any>,
  ) {
    // 푸시 토큰 유효성 검사
    if (!pushToken || !this.expoService.isExpoPushToken(pushToken)) {
      return null;
    }

    // 푸시 알림 전송
    await this.expoService.sendPushNotifications([
      {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
      },
    ]);

    // DB에 알림 기록 저장
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
      },
    });
  }

  // 6. 중복 알림 체크
  async hasNotificationToday(type: string, bodyContains: string): Promise<boolean> {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const todayString = kstDate.toISOString().split('T')[0];
    const todayStart = new Date(todayString + 'T00:00:00.000Z');

    const existing = await this.prisma.notification.findFirst({
      where: {
        type,
        createdAt: { gte: todayStart },
        body: { contains: bodyContains },
      },
    });

    return !!existing;
  }
}

