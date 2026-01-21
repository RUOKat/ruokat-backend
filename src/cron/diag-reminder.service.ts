import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { DynamoDBService } from '../aws/dynamodb.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DiagReminderService {
  private readonly logger = new Logger(DiagReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamoDBService: DynamoDBService,
    private readonly notificationsService: NotificationsService,
  ) { }

  // 1분마다 실행
  @Cron(CronExpression.EVERY_MINUTE)
  async handleDiagReminder() {
    this.logger.log('Running diag reminder cron job...');

    try {
      // 오늘 날짜 (KST)
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstDate = new Date(now.getTime() + kstOffset);
      const todayString = kstDate.toISOString().split('T')[0];

      // 1. 당일 careLog 중 answers는 있고 diagAnswers가 없는 데이터 조회
      const careLogs = await this.prisma.careLog.findMany({
        where: {
          date: todayString,
        },
        select: {
          petId: true,
          answers: true,
          diagAnswers: true,
        },
      });

      // answers가 있고 diagAnswers가 null인 것만 필터링
      const pendingLogs = careLogs.filter(log => log.answers !== null && log.diagAnswers === null);

      if (pendingLogs.length === 0) {
        this.logger.log('No pending diag reminders found');
        return;
      }

      this.logger.log(`Found ${pendingLogs.length} care logs without diag answers`);

      const tableName = process.env.AWS_DYNAMODB_DIAGNOSTIC_TABLE_NAME;
      if (!tableName) {
        this.logger.warn('AWS_DYNAMODB_DIAGNOSTIC_TABLE_NAME not configured');
        return;
      }

      let sentCount = 0;

      for (const careLog of pendingLogs) {
        const { petId } = careLog;

        // 2. DynamoDB에서 해당 petId의 진단 질문이 있는지 확인
        const items = await this.dynamoDBService.query({
          TableName: tableName,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': { S: petId },
          },
          ScanIndexForward: false,
          Limit: 1,
        });

        if (!items || items.length === 0) {
          continue; // 진단 질문이 없으면 스킵
        }

        const latestItem = items[0];
        const generatedQuestions = latestItem.generated_questions?.L;

        if (!generatedQuestions || generatedQuestions.length === 0) {
          continue; // 질문이 없으면 스킵
        }

        // 이미 알림을 보냈는지 확인 (오늘 날짜로)
        const alreadySent = await this.notificationsService.hasNotificationToday('DIAG_REMINDER', petId);
        if (alreadySent) {
          continue; // 이미 오늘 알림을 보냈으면 스킵
        }

        // 3. 해당 pet의 user 찾기
        const pet = await this.prisma.pet.findUnique({
          where: { id: petId },
          include: {
            user: true,
          },
        });

        if (!pet || !pet.user) {
          continue;
        }

        const user = pet.user;
        const pushToken = user.pushToken;

        if (!pushToken) {
          this.logger.log(`No push token for user ${user.id}`);
          continue;
        }

        // 4. 푸시 알림 전송 및 DB 저장
        const title = '진단 설문에 참여해주세요 🐱';
        const body = `${pet.name}의 맞춤 진단 질문이 준비되었어요! (petId: ${petId})`;

        await this.notificationsService.sendPushNotification(
          user.id,
          pushToken,
          title,
          body,
          'DIAG_REMINDER',
          {
            type: 'DIAG_REMINDER',
            petId,
            petName: pet.name,
          },
        );

        this.logger.log(`Sent diag reminder for pet ${pet.name} (${petId})`);
        sentCount++;
      }

      this.logger.log(`Sent ${sentCount} diag reminder notifications`);
    } catch (error) {
      this.logger.error(`Diag reminder cron job failed: ${error}`);
    }
  }
}
