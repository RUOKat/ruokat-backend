// src/dashboard/dto/dashboard-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

// 1. 차트 데이터 포인트 (Recharts 호환 포맷: x, y)
export class ChartPointDto {
  @ApiProperty({ example: 'Mon', description: 'X축 라벨 (요일, 날짜 등)' })
  x: string;

  @ApiProperty({ example: 85.5, description: 'Y축 값 (데이터)' })
  y: number;
}

// 2. 메트릭 (지표) 정보
export class MetricDto {
  @ApiProperty({ example: 'appetite' })
  id: string;

  @ApiProperty({ example: '식욕' })
  label: string;

  @ApiProperty({ example: 15.5, description: '지난주 대비 변화율' })
  changePercent: number;

  @ApiProperty({ example: '지난주보다 늘었어요' })
  trendLabel: string;

  @ApiProperty({ example: 'var(--color-chart-1)', required: false })
  color?: string;

  // [핵심] Swagger에 차트 데이터 예시를 명확히 보여줌
  @ApiProperty({
    type: [ChartPointDto],
    description: '최근 7일간의 변화 추이 (Recharts 호환 데이터)',
    example: [
      { x: 'Mon', y: 2 },
      { x: 'Tue', y: 3 },
      { x: 'Wed', y: 2 },
      { x: 'Thu', y: 4 },
      { x: 'Fri', y: 4 },
      { x: 'Sat', y: 3 },
      { x: 'Sun', y: 5 },
    ],
  })
  chartData: ChartPointDto[];
}

export class CoverageDto {
  @ApiProperty({ example: 7 })
  totalDays: number;

  @ApiProperty({ example: 5 })
  daysWithData: number;
}

export class RiskStatusDto {
  @ApiProperty({ example: 'warning' })
  level: string; // safe, warning, danger

  @ApiProperty({ example: '식욕 저하가 감지되었습니다.' })
  description: string;
}

export class DashboardSummaryDto {
  @ApiProperty()
  catId: string;

  @ApiProperty({ example: 'safe' })
  status: string; // safe, warning, danger

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: CoverageDto })
  coverage: CoverageDto;

  @ApiProperty({ type: [MetricDto] })
  metrics: MetricDto[];

  @ApiProperty({ type: [String], example: ['활동량이 아주 좋아요!', '음수량이 충분해요'] })
  insights: string[];

  @ApiProperty({ type: RiskStatusDto, required: false })
  riskStatus?: RiskStatusDto;
}

export class WeeklyReportDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: '1월 1주차' })
  rangeLabel: string;

  @ApiProperty({ example: '전반적으로 건강했어요.' })
  summary: string;

  @ApiProperty({ example: 95 })
  score: number;

  @ApiProperty({ example: 'safe' })
  status: string;
}