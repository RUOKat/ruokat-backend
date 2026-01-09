// src/users/dto/change-password.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';


export class ChangePasswordDto {
  @ApiProperty({ description: '현재 비밀번호', example: 'password123' })
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @ApiProperty({ description: '새로운 비밀번호', example: 'newpassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}