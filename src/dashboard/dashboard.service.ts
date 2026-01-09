// src/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import {
  DashboardSummaryDto,
  MetricDto,
  WeeklyReportDto,
} from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  async getSummary(catId: string): Promise<DashboardSummaryDto> {
    // 실제 DB 조회 로직이 들어갈 자리 (지금은 Mock Data 리턴)
    return {
      catId,
      status: 'safe', // safe, warning, danger
      updatedAt: new Date(),
      coverage: {
        totalDays: 7,
        daysWithData: 5,
      },
      metrics: [
        this.createMockMetric('appetite', '식욕', 12.5),
        this.createMockMetric('water', '음수', -5.2),
        this.createMockMetric('litter', '배변', 0.0),
        this.createMockMetric('activity', '활동량', 20.1),
      ],
      insights: [
        '활동량이 지난주보다 크게 늘었어요! 🏃',
        '음수량이 조금 부족해요. 습식 사료를 고려해보세요. 💧',
      ],
      // [선택] 위험 상태가 감지되었을 때만 포함
      riskStatus: {
        level: 'warning',
        description: '최근 2일간 음수량이 권장량 미만입니다.',
      },
    };
  }

  async getReports(catId: string): Promise<WeeklyReportDto[]> {
    return [
      {
        id: 'rep_01',
        rangeLabel: '1월 1주차',
        summary: '전반적으로 건강했지만, 주말에 활동량이 조금 줄었어요.',
        score: 92,
        status: 'safe',
      },
      {
        id: 'rep_02',
        rangeLabel: '12월 4주차',
        summary: '완벽한 한 주였습니다! 👏',
        score: 100,
        status: 'safe',
      },
    ];
  }

  // [수정됨] Recharts 형식({ x, y })에 맞춰 Mock 데이터 생성
  private createMockMetric(
    id: string,
    label: string,
    changePercent: number,
  ): MetricDto {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return {
      id,
      label,
      changePercent,
      trendLabel: changePercent > 0 ? '늘었어요' : '줄었어요',
      // 차트 데이터 생성 로직 수정 (day -> x, value -> y)
      chartData: Array.from({ length: 7 }, (_, i) => ({
        x: days[i], // 요일 (String)
        y: Math.floor(Math.random() * 100) / 10, // 랜덤 값 (Number)
      })),
    };
  }
}