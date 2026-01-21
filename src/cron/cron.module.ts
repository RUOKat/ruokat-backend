import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DiagReminderService } from './diag-reminder.service';
import { ReportNotificationService } from './report-notification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AwsModule } from '../aws/aws.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AwsModule,
    NotificationsModule,
  ],
  providers: [DiagReminderService, ReportNotificationService],
})
export class CronModule { }
