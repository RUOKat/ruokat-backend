import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';

// [수정] S3가 추가해주는 속성을 인식하도록 타입 확장
interface MulterS3File extends Express.Multer.File {
  location: string;
  key: string;
}

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @ApiOperation({ summary: '이미지 업로드 (S3)' })
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
  // [수정] 확장한 인터페이스(MulterS3File) 사용
  async uploadImage(@UploadedFile() file: MulterS3File) {
    return {
      url: file.location,
      key: file.key,
    };
  }
}