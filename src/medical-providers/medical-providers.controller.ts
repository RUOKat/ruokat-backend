import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MedicalProvidersService } from './medical-providers.service';
import { CreateMedicalProviderDto, UpdateMedicalProviderDto } from './dto/medical-provider.dto';

@ApiTags('Medical Providers')
@Controller('medical-providers')
export class MedicalProvidersController {
  constructor(private readonly service: MedicalProvidersService) { }

  @Post()
  @ApiOperation({ summary: '기관/의사 등록' })
  create(@Body() dto: CreateMedicalProviderDto) {
    return this.service.create(null, dto);
  }

  @Get()
  @ApiOperation({ summary: '기관/의사 목록 조회' })
  findAll() {
    return this.service.findAll(null);
  }

  @Get(':id')
  @ApiOperation({ summary: '기관/의사 상세 조회' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(null, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '기관/의사 수정' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMedicalProviderDto,
  ) {
    return this.service.update(null, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '기관/의사 삭제' })
  remove(@Param('id') id: string) {
    return this.service.remove(null, id);
  }
}
