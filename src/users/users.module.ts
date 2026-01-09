// src/users/users.module.ts

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AccountController } from './account.controller'; // [1] import 확인
import { AuthModule } from '@/auth/auth.module';
import { ExpoModule } from '@/expo/expo.module';

@Module({
  // [2] 아래 줄에 AccountController가 반드시 있어야 합니다!
  controllers: [UsersController, AccountController], 
  providers: [UsersService],
  exports: [UsersService],
  imports: [AuthModule, ExpoModule],
})
export class UsersModule {}