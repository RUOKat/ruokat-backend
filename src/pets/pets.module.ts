import { Module } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { CognitoAuthGuard } from '@/auth/cognito-auth.guard';
import { AuthModule } from '@/auth/auth.module';

@Module({
  controllers: [PetsController],
  providers: [PetsService],
  imports: [AuthModule],
})
export class PetsModule {}


