import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetMonthlyCareDto {
  @ApiProperty({ description: '조회할 연도', example: '2026' })
  @IsString()
  @Length(4, 4) // "2026" 처럼 딱 4글자만 허용
  year: string;

  @ApiProperty({ description: '조회할 월', example: '01' })
  @IsString()
  month: string;
}