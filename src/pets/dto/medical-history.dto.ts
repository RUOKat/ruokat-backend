import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

// MedicalHistory DTO matching frontend type
export class MedicalHistoryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedGroupIds?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedItemIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  placeholder?: string;
}


