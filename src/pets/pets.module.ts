import { Module } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
// import { CognitoAuthGuard } from '@/auth/cognito-auth.guard'; // (필요하다면 유지)
import { AuthModule } from '@/auth/auth.module';
import { AwsModule } from '../aws/aws.module'; // 👈 [추가] AWS 모듈 가져오기

@Module({
  controllers: [PetsController],
  providers: [PetsService],
  imports: [
    AuthModule,
    AwsModule, // 👈 [추가] 이제 PetsService에서 DynamoDBService를 쓸 수 있습니다.
  ],
})
export class PetsModule {}