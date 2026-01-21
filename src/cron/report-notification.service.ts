import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { DynamoDBService } from '../aws/dynamodb.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReportNotificationService {
  private readonly logger = new Logger(ReportNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamoDBService: DynamoDBService,
    private readonly notificationsService: NotificationsService,
  ) { }

  // 1분마다 실행
  @Cron(CronExpression.EVERY_MINUTE)
  async handleReportNotification() {
    this.logger.log('Running report notification cron job...');

    try {
      // 오늘 날짜 (KST)
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstDate = new Date(now.getTime() + kstOffset);
      const todayString = kstDate.toISOString().split('T')[0];

      // 1. 당일 careLog 중 diagAnswers가 있는 (완료된) 데이터 조회
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

      // answers와 diagAnswers 둘 다 있는 것만 필터링 (완전히 완료된 것)
      const completedLogs = careLogs.filter(
        log => log.answers !== null && log.diagAnswers !== null
      );

      if (completedLogs.length === 0) {
        this.logger.log('No completed care logs found');
        return;
      }

      this.logger.log(`Found ${completedLogs.length} completed care logs`);

      const tableName = process.env.AWS_DYNAMODB_DIAGNOSTIC_TABLE_NAME;
      if (!tableName) {
        this.logger.warn('AWS_DYNAMODB_DIAGNOSTIC_TABLE_NAME not configured');
        return;
      }

      let sentCount = 0;

      for (const careLog of completedLogs) {
        const { petId } = careLog;

        // 2. 이미 알림을 보냈는지 확인 (오늘 날짜로)
        const alreadySent = await this.notificationsService.hasNotificationToday(
          'REPORT_READY',
          petId
        );
        if (alreadySent) {
          continue;
        }

        // 3. DynamoDB에서 해당 petId의 final_report 확인
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
          continue;
        }

        const latestItem = items[0];
        const finalReport = latestItem.final_report?.S;

        if (!finalReport) {
          continue; // final_report가 없으면 스킵
        }

        // 4. 해당 pet의 user 찾기
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

        // 5. 리포트 앞부분 추출 (최대 50자)
        const reportPreview = finalReport.length > 50
          ? finalReport.substring(0, 50) + '...'
          : finalReport;

        // 6. 푸시 알림 전송 및 DB 저장
        const title = `${pet.name}의 건강 리포트가 도착했어요 📋`;
        const body = `${reportPreview} (petId: ${petId})`;

        await this.notificationsService.sendPushNotification(
          user.id,
          pushToken,
          title,
          body,
          'REPORT_READY',
          {
            type: 'REPORT_READY',
            petId,
            petName: pet.name,
          },
        );

        this.logger.log(`Sent report notification for pet ${pet.name} (${petId})`);
        sentCount++;
      }

      this.logger.log(`Sent ${sentCount} report notifications`);
    } catch (error) {
      this.logger.error(`Report notification cron job failed: ${error}`);
    }
  }
}
