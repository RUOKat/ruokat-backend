import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AuthModule } from '../auth/auth.module'; // 👈 1. 경로 확인!

@Module({
  imports: [
    AuthModule, // 👈 2. [핵심] AuthModule을 가져와야 CognitoService를 쓸 수 있음!
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}