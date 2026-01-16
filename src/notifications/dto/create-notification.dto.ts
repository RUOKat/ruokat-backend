import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: '알림 제목', example: '환영합니다!' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '알림 내용', example: 'RUOKat에 오신 것을 환영합니다.' })
  @IsString()
  @IsNotEmpty()
  body: string;
}