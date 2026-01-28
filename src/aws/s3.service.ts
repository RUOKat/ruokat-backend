import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AwsService } from './aws.service';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3UsEast1: S3Client;

  constructor(
    private readonly awsService: AwsService,
    private readonly configService: ConfigService,
  ) {
    // us-east-1 리전용 S3 클라이언트 (펫캠 버킷용)
    this.s3UsEast1 = new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  // 기본 리전 (ap-northeast-2) 사용
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

  async listObjects(bucket: string, prefix?: string, maxKeys: number = 100) {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });
    return this.awsService.s3.send(command);
  }

  async getSignedUrlsForObjects(bucket: string, keys: string[], expiresIn: number = 3600) {
    const urls = await Promise.all(
      keys.map(async (key) => {
        const url = await this.getSignedUrl(bucket, key, expiresIn);
        return { key, url };
      })
    );
    return urls;
  }

  // us-east-1 리전용 메서드들 (펫캠 버킷용)
  async listObjectsUsEast1(bucket: string, prefix?: string, maxKeys: number = 100) {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });
    return this.s3UsEast1.send(command);
  }

  async getSignedUrlUsEast1(bucket: string, key: string, expiresIn: number = 3600) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return getSignedUrl(this.s3UsEast1, command, { expiresIn });
  }

  async getSignedUrlsForObjectsUsEast1(bucket: string, keys: string[], expiresIn: number = 3600) {
    const urls = await Promise.all(
      keys.map(async (key) => {
        const url = await this.getSignedUrlUsEast1(bucket, key, expiresIn);
        return { key, url };
      })
    );
    return urls;
  }

  async deleteObjectUsEast1(bucket: string, key: string) {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return this.s3UsEast1.send(command);
  }

  async uploadFileUsEast1(bucket: string, key: string, body: Buffer, contentType?: string) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType || 'image/jpeg',
    });
    return this.s3UsEast1.send(command);
  }
}
