import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { CareService } from './care.service';
import { CognitoAuthGuard } from '../auth/cognito-auth.guard';
import { GetMonthlyCareDto } from './dto/get-monthly-care.dto';
import { CheckInDto } from './dto/check-in.dto';
import { DiagDto } from './dto/diag.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Care')
@Controller('care')
export class CareController {
  constructor(private readonly careService: CareService) { }

  @ApiBearerAuth('access-token')
  @UseGuards(CognitoAuthGuard)
  @Get('questions')
  async getQuestions() {
    return this.careService.getQuestions();
  }

  // petId별 맞춤 질문 (DynamoDB question_bank 포함)
  @ApiBearerAuth('access-token')
  @UseGuards(CognitoAuthGuard)
  @Get(':petId/questions')
  async getQuestionsForPet(@Param('petId') petId: string) {
    return this.careService.getQuestionsForPet(petId);
  }

  // petId별 진단 질문 (DynamoDB DiagnosticTable에서 가져옴)
  @ApiBearerAuth('access-token')
  @UseGuards(CognitoAuthGuard)
  @Get(':petId/diag-questions')
  async getDiagQuestions(@Param('petId') petId: string) {
    return this.careService.getDiagQuestionsFromDynamoDB(petId);
  }

  // Protected endpoints below
  @ApiBearerAuth('access-token')
  @UseGuards(CognitoAuthGuard)
  @Get(':petId/monthly')
  async getMonthlyCare(
    @Param('petId') petId: string,
    @Query() query: GetMonthlyCareDto,
  ) {
    return this.careService.getMonthlyCare(petId, query.year, query.month);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(CognitoAuthGuard)
  @Post(':petId/check-in')
  async checkIn(
    @Param('petId') petId: string,
    @Body() checkInDto: CheckInDto,
  ) {
    return this.careService.checkIn(petId, checkInDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(CognitoAuthGuard)
  @Post(':petId/diag')
  async diag(
    @Param('petId') petId: string,
    @Body() diagDto: DiagDto,
  ) {
    return this.careService.diag(petId, diagDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(CognitoAuthGuard)
  @Get(':petId/log/:date')
  async getCareLog(
    @Param('petId') petId: string,
    @Param('date') date: string,
  ) {
    return this.careService.getCareLogByDate(petId, date);
  }

  // 월간 케어 통계 (핵심 지표)
  @ApiBearerAuth('access-token')
  @UseGuards(CognitoAuthGuard)
  @Get(':petId/monthly-stats')
  async getMonthlyStats(
    @Param('petId') petId: string,
    @Query() query: GetMonthlyCareDto,
  ) {
    return this.careService.getMonthlyStats(petId, query.year, query.month);
  }

  // 일일 리포트 조회 (DynamoDB DiagnosticTable final_report)
  @ApiBearerAuth('access-token')
  @UseGuards(CognitoAuthGuard)
  @Get(':petId/daily-reports')
  async getDailyReports(@Param('petId') petId: string) {
    return this.careService.getDailyReports(petId);
  }
}