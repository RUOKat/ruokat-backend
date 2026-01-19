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
}