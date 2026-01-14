import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AwsModule } from '../aws/aws.module'; // 👈 [추가] DynamoDBService를 쓰기 위해 필요
import { AuthModule } from '../auth/auth.module'; // 👈 (Controller에서 AuthGuard를 쓴다면 필요)

@Module({
  imports: [
    AwsModule,  // 👈 여기에 등록해야 DashboardService에서 주입받을 수 있음!
    AuthModule, // (인증 관련)
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}