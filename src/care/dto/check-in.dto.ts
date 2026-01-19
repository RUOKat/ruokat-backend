import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckInDto {
  @ApiPropertyOptional({
    description: '체크인 질문 목록',
    example: [
      { id: 'q1', text: '오늘 물을 잘 마셨나요?' },
      { id: 'q2', text: '식사는 잘 했나요?' }
    ]
  })
  @IsOptional()
  questions?: any;

  @ApiPropertyOptional({
    description: '체크인 답변 목록',
    example: {
      q1: 'yes',
      q2: 'yes'
    }
  })
  @IsOptional()
  answers?: any;
}
