import { IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DiagDto {
  @ApiPropertyOptional({
    description: '진단 질문 목록',
    example: [
      { id: 'dq1', text: '최근 배뇨 횟수가 증가했나요?' },
      { id: 'dq2', text: '소변 색깔에 변화가 있나요?' }
    ]
  })
  @IsOptional()
  @IsObject()
  diagQuestions?: any;

  @ApiPropertyOptional({
    description: '진단 답변 목록',
    example: [
      { questionId: 'dq1', answer: 'yes' },
      { questionId: 'dq2', answer: 'no' }
    ]
  })
  @IsOptional()
  @IsObject()
  diagAnswers?: any;
}
