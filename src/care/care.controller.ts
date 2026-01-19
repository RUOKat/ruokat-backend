import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { CareService } from './care.service';
import { CognitoAuthGuard } from '../auth/cognito-auth.guard';
import { GetMonthlyCareDto } from './dto/get-monthly-care.dto';
import { CheckInDto } from './dto/check-in.dto';
import { DiagDto } from './dto/diag.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Care')
@ApiBearerAuth('access-token')
@UseGuards(CognitoAuthGuard)
@Controller('care')
export class CareController {
  constructor(private readonly careService: CareService) { }

  // 👇 DTO 적용된 부분 (쿼리 파라미터 검사)
  @Get(':petId/monthly')
  async getMonthlyCare(
    @Param('petId') petId: string,
    @Query() query: GetMonthlyCareDto,
  ) {
    return this.careService.getMonthlyCare(petId, query.year, query.month);
  }

  @Post(':petId/check-in')
  async checkIn(
    @Param('petId') petId: string,
    @Body() checkInDto: CheckInDto,
  ) {
    return this.careService.checkIn(petId, checkInDto);
  }

  @Post(':petId/diag')
  async diag(
    @Param('petId') petId: string,
    @Body() diagDto: DiagDto,
  ) {
    return this.careService.diag(petId, diagDto);
  }
}