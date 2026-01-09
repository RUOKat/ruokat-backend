// 파일 경로: src/users/dto/update-user.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: '사용자 닉네임', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  // [중요] 이 부분이 있어야 에러가 사라집니다.
  @ApiProperty({ description: '프로필 이미지 (Base64 or URL)', required: false })
  @IsOptional()
  @IsString()
  profilePhoto?: string;

  // [중요] 이 부분이 있어야 에러가 사라집니다.
  @ApiProperty({ description: '연락처 (예: 010-0000-0000)', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}