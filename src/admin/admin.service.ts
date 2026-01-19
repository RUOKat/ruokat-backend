import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpoService } from '../expo/expo.service';
import { ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly expoService: ExpoService,
  ) { }

  /**
   * 이메일로 유저 찾아서 푸시 알림 전송
   */
  async sendNotificationByEmail(email: string, title: string, body: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`이메일 ${email}에 해당하는 유저를 찾을 수 없습니다.`);
    }

    return this.sendNotificationToUser(user.id, user.pushToken, title, body);
  }

  /**
   * Pet ID로 해당 펫의 주인에게 푸시 알림 전송
   */
  async sendNotificationByPetId(petId: string, title: string, body: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: { user: true },
    });

    if (!pet) {
      throw new NotFoundException(`펫 ID ${petId}를 찾을 수 없습니다.`);
    }

    return this.sendNotificationToUser(pet.user.id, pet.user.pushToken, title, body);
  }

  /**
   * 유저에게 알림 전송 (DB 저장 + 푸시)
   */
  private async sendNotificationToUser(
    userId: string,
    pushToken: string | null,
    title: string,
    body: string,
  ) {
    // 1. DB에 알림 저장
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type: 'ADMIN',
      },
    });

    // 2. 푸시 토큰이 있으면 푸시 알림 전송
    let pushResult = null;
    if (pushToken && this.expoService.isExpoPushToken(pushToken)) {
      const message: ExpoPushMessage = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: { notificationId: notification.id },
      };

      const tickets = await this.expoService.sendPushNotifications([message]);
      pushResult = tickets[0] ?? null;
    }

    return {
      success: true,
      notification,
      pushSent: !!pushResult,
      pushResult,
    };
  }
}
