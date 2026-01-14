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
      const region = this.configService.get<string>('AWS_REGION');
      const dynamodb_region = this.configService.get<string>('AWS_DYNAMODB_REGION');
      
      const credentials = {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      };

      if (!region) {
        throw new Error('AWS_REGION is not defined in environment variables');
      }
      if (!dynamodb_region) {
        throw new Error('AWS_DYNAMODB_REGION is not defined in environment variables');
      }
      if (!credentials.accessKeyId || !credentials.secretAccessKey) {
        throw new Error('AWS credentials are not defined in environment variables');
      }

      this.s3 = new S3Client({
        region, 
        credentials,
      });

      this.dynamodb = new DynamoDBClient({
        region: dynamodb_region,
        credentials,
      });
      
    } catch (error) {
      console.error('Error initializing AWS clients:', error);
    }
  }
}