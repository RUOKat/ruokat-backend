import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { CareService } from './care.service';
import { CognitoAuthGuard } from '../auth/cognito-auth.guard';
import { GetMonthlyCareDto } from './dto/get-monthly-care.dto'; 
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Care')
@ApiBearerAuth('access-token')
@UseGuards(CognitoAuthGuard)
@Controller('care')
export class CareController {
  constructor(private readonly careService: CareService) {}

  // 👇 DTO 적용된 부분 (쿼리 파라미터 검사)
  @Get(':petId/monthly')
  async getMonthlyCare(
    @Param('petId') petId: string,
    @Query() query: GetMonthlyCareDto,
  ) {
    return this.careService.getMonthlyCare(petId, query.year, query.month);
  }

  @Post(':petId/checkin')
  async checkIn(@Param('petId') petId: string) {
    return this.careService.checkIn(petId);
  }
}