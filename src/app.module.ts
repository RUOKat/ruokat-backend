import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PetsModule } from './pets/pets.module';
import { AppController } from './app.controller';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadsModule } from './uploads/uploads.module';

import { AwsModule } from './aws/aws.module';
import { ExpoModule } from './expo/expo.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CareModule } from './care/care.module';
import { AdminModule } from './admin/admin.module';
import { CronModule } from './cron/cron.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    MetricsModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    PetsModule,
    DashboardModule,
    UploadsModule,
    AwsModule,
    ExpoModule,
    NotificationsModule,
    CareModule,
    AdminModule,
    CronModule,
  ],
  controllers: [AppController],
})
export class AppModule { }


