import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { DynamoDBService } from '../aws/dynamodb.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FgsNotificationService {
  private readonly logger = new Logger(FgsNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamoDBService: DynamoDBService,
    private readonly notificationsService: NotificationsService,
  ) { }

  // 1분마다 실행
  @Cron(CronExpression.EVERY_MINUTE)
  async handleFgsNotification() {
    this.logger.log('Running FGS notification cron job...');

    try {
      const tableName = process.env.AWS_DYNAMODB_FGS_RESULT_TABLE_NAME;
      if (!tableName) {
        this.logger.warn('AWS_DYNAMODB_FGS_RESULT_TABLE_NAME not configured');
        return;
      }

      // 모든 pet 조회
      const pets = await this.prisma.pet.findMany({
        include: {
          user: true,
        },
      });

      let sentCount = 0;

      for (const pet of pets) {
        const { id: petId, name: petName, user } = pet;

        if (!user || !user.pushToken) {
          continue;
        }

        // 1. DynamoDB에서 해당 petId의 최근 FGS 결과 조회
        // PK 형식: CAT#petId
        const items = await this.dynamoDBService.query({
          TableName: tableName,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': { S: `CAT#${petId}` },
          },
          ScanIndexForward: false, // 최신순
          Limit: 1,
        });

        if (!items || items.length === 0) {
          continue;
        }

        const latestItem = items[0];
        const sk = latestItem.SK?.S || '';
        const fgsScore = latestItem.fgsScore?.S || '';
        const explanation = latestItem.explanation?.S || '';

        if (!explanation) {
          continue;
        }

        // 2. 이미 같은 SK(시간)로 알림을 보냈는지 확인
        const alreadySent = await this.notificationsService.hasNotificationToday(
          'FGS_RESULT',
          `[${petId}:${sk}]`
        );
        if (alreadySent) {
          continue;
        }

        // 3. 마크다운 제거 및 미리보기 생성
        const cleanResult = explanation
          .replace(/#{1,6}\s*/g, '')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1')
          .replace(/`([^`]+)`/g, '$1')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/^[-*+]\s+/gm, '')
          .replace(/^\d+\.\s+/gm, '')
          .replace(/>\s*/g, '')
          .replace(/\n+/g, ' ')
          .trim();

        const resultPreview = cleanResult.length > 50
          ? cleanResult.substring(0, 50) + '...'
          : cleanResult;

        // 4. 푸시 알림 전송
        const title = `${petName}의 FGS 분석 결과 (점수: ${fgsScore}) 🐱`;
        const body = `${resultPreview} [${petId}:${sk}]`;

        await this.notificationsService.sendPushNotification(
          user.id,
          user.pushToken,
          title,
          body,
          'FGS_RESULT',
          {
            type: 'FGS_RESULT',
            petId,
            petName,
            fgsScore,
          },
        );

        this.logger.log(`Sent FGS notification for pet ${petName} (${petId}), score: ${fgsScore}`);
        sentCount++;
      }

      this.logger.log(`Sent ${sentCount} FGS notifications`);
    } catch (error) {
      this.logger.error(`FGS notification cron job failed: ${error}`);
    }
  }
}
