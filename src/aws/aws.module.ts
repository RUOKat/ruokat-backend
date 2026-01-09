import { Module } from '@nestjs/common';
import { AwsService } from './aws.service';
import { S3Service } from './s3.service';
import { DynamoDBService } from './dynamodb.service';

@Module({
  providers: [AwsService, S3Service, DynamoDBService],
  exports: [AwsService, S3Service, DynamoDBService],
})
export class AwsModule {}
