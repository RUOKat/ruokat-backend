import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class UploadsService {
  private s3: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get('AWS_REGION') ?? '',
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  // createMulterOptions 메서드는 삭제했습니다. (Module로 이동됨)
  
  // 추후 파일 삭제 기능 등이 필요하면 여기에 추가합니다.
}