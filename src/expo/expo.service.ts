import { Injectable } from '@nestjs/common';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class ExpoService {
  private readonly expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  async sendPushNotifications(messages: ExpoPushMessage[]) {
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        // NOTE: If you want to handle receipts, you can do it here.
        // For now, we'll just send the notifications.
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    return tickets;
  }

  isExpoPushToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }
}
