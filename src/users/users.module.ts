import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '@/auth/auth.module';
import { ExpoModule } from '@/expo/expo.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
  imports: [AuthModule, ExpoModule],
})
export class UsersModule {}