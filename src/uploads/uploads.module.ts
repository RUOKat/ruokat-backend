// src/uploads/uploads.module.ts

import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      // [중요] UploadsService가 아니라 ConfigService를 주입받습니다.
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // 1. S3 Client 생성
        const s3 = new S3Client({
          region: configService.get('AWS_REGION') ?? '',
          credentials: {
            accessKeyId: configService.get('AWS_ACCESS_KEY_ID') ?? '',
            secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY') ?? '',
          },
        });

        // 2. Multer 옵션 생성 및 반환
        return {
          storage: multerS3({
            s3: s3,
            bucket: configService.get('AWS_S3_BUCKET_NAME') ?? '',
            contentType: multerS3.AUTO_CONTENT_TYPE,
            key: (req: any, file: any, cb: any) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
              const ext = file.originalname.split('.').pop();
              cb(null, `uploads/${uniqueSuffix}.${ext}`);
            },
          }),
          limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
        };
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}