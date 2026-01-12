// src/uploads/uploads.controller.ts

import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';

interface MulterS3File extends Express.Multer.File {
  location?: string; // [변경] S3가 없으면 없을 수도 있으므로 Optional(?) 처리
  key?: string;      // [변경] Optional
}

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @ApiOperation({ summary: '이미지 업로드 (S3 or Mock)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: MulterS3File) {
    // [핵심 수정] S3 업로드가 안 됐을 경우(file.location 없음), 가짜 고양이 사진 URL 리턴
    const url = file?.location || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
    const key = file?.key || 'mock-image-key.jpg';

    return {
      url,
      key,
    };
  }
}