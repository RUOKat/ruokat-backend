import { Module } from '@nestjs/common';
import { MedicalProvidersController } from './medical-providers.controller';
import { MedicalProvidersService } from './medical-providers.service';
import { AwsModule } from '@/aws/aws.module';
import { AuthModule } from '@/auth/auth.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [    
    PrismaModule,
    AuthModule,
  ],
  controllers: [MedicalProvidersController],
  providers: [MedicalProvidersService],
  exports: [MedicalProvidersService],
})
export class MedicalProvidersModule { }
