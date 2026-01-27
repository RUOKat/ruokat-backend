import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CognitoAuthGuard } from '../auth/cognito-auth.guard';
import { MedicalProvidersService } from './medical-providers.service';
import { CreateMedicalProviderDto, UpdateMedicalProviderDto } from './dto/medical-provider.dto';

@ApiTags('Medical Providers')
@ApiBearerAuth('access-token')
@UseGuards(CognitoAuthGuard)
@Controller('medical-providers')
export class MedicalProvidersController {
  constructor(private readonly service: MedicalProvidersService) { }

  @Post()
  @ApiOperation({ summary: '기관/의사 등록' })
  create(@Req() req: any, @Body() dto: CreateMedicalProviderDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '기관/의사 목록 조회' })
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '기관/의사 상세 조회' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '기관/의사 수정' })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateMedicalProviderDto,
  ) {
    return this.service.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '기관/의사 삭제' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.userId, id);
  }
}
