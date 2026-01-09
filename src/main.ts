// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // [수정 1] CORS 설정을 조건문 밖으로 빼서 개발 중 항상 허용 (프론트엔드 연동 필수)
  app.enableCors({
    origin: true, // true로 설정하면 요청 온 도메인(localhost:3000)을 자동으로 허용
    credentials: true, // 쿠키/인증 헤더 허용
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // [수정 2] Body Parser (S3 도입으로 JSON 용량은 작아지지만, 안전을 위해 유지)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.setGlobalPrefix('api');

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Ruokat API')
    .setDescription('Ruokat backend API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'AWS Cognito Access Token',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  // Global Pipes & Interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // DTO에 없는 필드가 오면 에러 (엄격 모드)
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // 포트 설정
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port);

  const serverUrl = await app.getUrl();
  console.log(`==========================================================`);
  console.log(`🚀 Server running at: ${serverUrl}`);
  console.log(`📘 Swagger UI:      ${serverUrl}/swagger`);
  console.log(`📡 CORS Enabled:    Origin=true, Credentials=true`);
  console.log(`==========================================================`);
}

bootstrap();