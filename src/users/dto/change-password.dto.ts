import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'current1234!' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string; // 프론트엔드와 변수명 일치 필수

  @ApiProperty({ example: 'new1234!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string; // 프론트엔드와 변수명 일치 필수
}