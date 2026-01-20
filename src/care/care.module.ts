import { Module } from '@nestjs/common';
import { CareController } from './care.controller';
import { CareService } from './care.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AwsModule,
  ],
  controllers: [CareController],
  providers: [CareService],
})
export class CareModule { }