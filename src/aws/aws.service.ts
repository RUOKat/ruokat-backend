import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';

@Injectable()
export class AwsService implements OnModuleInit {
  private readonly logger = new Logger(AwsService.name);
  public s3: S3Client;
  public dynamodb: DynamoDBClient;

  constructor(private readonly configService: ConfigService) { }

  async onModuleInit() {
    try {
      const region = this.configService.get<string>('AWS_REGION');
      const dynamodb_region = this.configService.get<string>('AWS_DYNAMODB_REGION');

      const credentials = {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      };

      this.logger.log('========== AWS 연결 초기화 시작 ==========');
      this.logger.log(`S3 Region: ${region || 'NOT SET'}`);
      this.logger.log(`DynamoDB Region: ${dynamodb_region || 'NOT SET'}`);
      this.logger.log(`Access Key ID: ${credentials.accessKeyId ? credentials.accessKeyId.substring(0, 8) + '...' : 'NOT SET'}`);
      this.logger.log(`Secret Access Key: ${credentials.secretAccessKey ? '****설정됨****' : 'NOT SET'}`);

      if (!region) {
        this.logger.error('❌ AWS_REGION 환경변수가 설정되지 않았습니다');
        throw new Error('AWS_REGION is not defined in environment variables');
      }
      if (!dynamodb_region) {
        this.logger.error('❌ AWS_DYNAMODB_REGION 환경변수가 설정되지 않았습니다');
        throw new Error('AWS_DYNAMODB_REGION is not defined in environment variables');
      }
      if (!credentials.accessKeyId || !credentials.secretAccessKey) {
        this.logger.error('❌ AWS 자격 증명이 설정되지 않았습니다');
        throw new Error('AWS credentials are not defined in environment variables');
      }

      // S3 클라이언트 초기화
      this.s3 = new S3Client({
        region,
        credentials,
      });
      // DynamoDB 클라이언트 초기화
      this.dynamodb = new DynamoDBClient({
        region: dynamodb_region,
        credentials,
      });

      // S3 연결 테스트
      await this.testS3Connection();
      // DynamoDB 연결 테스트
      await this.testDynamoDBConnection();
      this.logger.log('========== AWS 연결 초기화 완료 ==========');

    } catch (error) {
      this.logger.error('❌ AWS 클라이언트 초기화 실패:', error);
      throw error;
    }
  }

  private async testS3Connection() {
    try {
      const command = new ListBucketsCommand({});
      const response = await this.s3.send(command);
      const bucketCount = response.Buckets?.length || 0;
      this.logger.log(`✅ S3 연결 성공 - 접근 가능한 버킷: ${bucketCount}개`);
      if (response.Buckets && response.Buckets.length > 0) {
        response.Buckets.slice(0, 5).forEach(bucket => {
          this.logger.log(`   - ${bucket.Name}`);
        });
        if (bucketCount > 5) {
          this.logger.log(`   ... 외 ${bucketCount - 5}개`);
        }
      }
    } catch (error) {
      this.logger.error(`❌ S3 연결 실패: ${error}`);
    }
  }

  private async testDynamoDBConnection() {
    try {
      const command = new ListTablesCommand({});
      const response = await this.dynamodb.send(command);
      const tableCount = response.TableNames?.length || 0;
      this.logger.log(`✅ DynamoDB 연결 성공 - 접근 가능한 테이블: ${tableCount}개`);
      if (response.TableNames && response.TableNames.length > 0) {
        response.TableNames.forEach(table => {
          this.logger.log(`   - ${table}`);
        });
      }

      // 환경변수에 설정된 테이블들 확인
      const configuredTables = [
        { name: 'AWS_DYNAMODB_DIAGNOSTIC_TABLE_NAME', value: this.configService.get<string>('AWS_DYNAMODB_DIAGNOSTIC_TABLE_NAME') },
        { name: 'AWS_DYNAMODB_DAILY_RECORD_TABLE_NAME', value: this.configService.get<string>('AWS_DYNAMODB_DAILY_RECORD_TABLE_NAME') },
        { name: 'AWS_DYNAMODB_UPDATED_TABLE_NAME', value: this.configService.get<string>('AWS_DYNAMODB_UPDATED_TABLE_NAME') },
        { name: 'AWS_DYNAMODB_FGS_RESULT_TABLE_NAME', value: this.configService.get<string>('AWS_DYNAMODB_FGS_RESULT_TABLE_NAME') },
      ];

      this.logger.log('--- 설정된 DynamoDB 테이블 환경변수 ---');
      configuredTables.forEach(({ name, value }) => {
        const exists = response.TableNames?.includes(value || '');
        const status = value ? (exists ? '✅' : '⚠️ 테이블 없음') : '❌ 미설정';
        this.logger.log(`   ${name}: ${value || 'NOT SET'} ${status}`);
      });

    } catch (error) {
      this.logger.error(`❌ DynamoDB 연결 실패: ${error}`);
    }
  }
}
