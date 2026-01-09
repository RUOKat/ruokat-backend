// src/dashboard/dashboard.controller.ts

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { CognitoAuthGuard } from '../auth/cognito-auth.guard';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto, WeeklyReportDto } from './dto/dashboard-response.dto';

@ApiTags('dashboard')
@ApiBearerAuth() // Swagger에서 JWT 토큰 입력 기능 활성화
@UseGuards(CognitoAuthGuard) // 컨트롤러 전체에 인증 가드 적용 (안전)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // 1. 대시보드 상단 요약 및 차트 데이터
  @Get(':catId/summary')
  @ApiOperation({ summary: '대시보드 메인 요약 데이터 조회 (차트 포함)' })
  @ApiOkResponse({ type: DashboardSummaryDto, description: '요약 정보 및 최근 7일 그래프 데이터' })
  async getSummary(@Param('catId') catId: string): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary(catId);
  }

  // 2. 하단 주간 리포트 목록
  @Get(':catId/reports')
  @ApiOperation({ summary: '주간 리포트 목록 조회' })
  @ApiOkResponse({ type: [WeeklyReportDto], description: '생성된 주간 리포트 리스트' })
  async getReports(@Param('catId') catId: string): Promise<WeeklyReportDto[]> {
    return this.dashboardService.getReports(catId);
  }
}