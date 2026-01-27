import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateCameraSettingsDto {
  @ApiProperty({
    description: '카메라 사용 설정',
    example: true
  })
  @IsBoolean()
  cameraEnabled: boolean;
}
