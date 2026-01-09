import { Injectable } from '@nestjs/common';
import { AwsService } from './aws.service';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  constructor(private readonly awsService: AwsService) {}

  async uploadFile(bucket: string, key: string, body: Buffer) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
    });
    return this.awsService.s3.send(command);
  }

  async getSignedUrl(bucket: string, key: string, expiresIn: number = 3600) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return getSignedUrl(this.awsService.s3, command, { expiresIn });
  }
}
