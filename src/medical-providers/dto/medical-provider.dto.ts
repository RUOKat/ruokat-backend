import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicalProviderDto {
  @ApiProperty({ description: '타입 (hospital, clinic, doctor)' })
  @IsString()
  type: string;

  @ApiProperty({ description: '기관명 또는 의사명' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '주소' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: '연락처' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '전문 분야' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMedicalProviderDto {
  @ApiPropertyOptional({ description: '타입 (hospital, clinic, doctor)' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '기관명 또는 의사명' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '주소' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: '연락처' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '전문 분야' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  notes?: string;
}
