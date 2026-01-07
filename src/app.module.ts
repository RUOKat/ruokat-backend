import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PetsModule } from './pets/pets.module';
import { AppController } from './app.controller';
import { AwsModule } from './aws/aws.module';
import { ExpoModule } from './expo/expo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PetsModule,
    AwsModule,
    ExpoModule,
  ],
  controllers: [AppController],
})
export class AppModule {}


