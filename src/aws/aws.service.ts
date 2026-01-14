import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

@Injectable()
export class AwsService implements OnModuleInit {
  public s3: S3Client;
  public dynamodb: DynamoDBClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    try {
      const region = this.configService.get<string>('AWS_REGION'); // S3용 (서울)
      const dynamodb_region = this.configService.get<string>('AWS_DYNAMODB_REGION'); // DynamoDB용 (버지니아)
      
      const credentials = {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      };

      if (!region) {
        throw new Error('AWS_REGION is not defined in environment variables');
      }
      // DynamoDB 리전이 환경변수에 없으면 에러 발생시키기 (안전장치)
      if (!dynamodb_region) {
        throw new Error('AWS_DYNAMODB_REGION is not defined in environment variables');
      }
      if (!credentials.accessKeyId || !credentials.secretAccessKey) {
        throw new Error('AWS credentials are not defined in environment variables');
      }

      // 1. S3 클라이언트 (기본 region 사용)
      this.s3 = new S3Client({
        region, 
        credentials,
      });

      // 2. DynamoDB 클라이언트 (별도 리전 사용)
      this.dynamodb = new DynamoDBClient({
        region: dynamodb_region, // 👈 [핵심] Key 이름은 무조건 'region'이어야 합니다!
        credentials,
      });
      
    } catch (error) {
      console.error('Error initializing AWS clients:', error);
      // throw error;
    }
  }
}