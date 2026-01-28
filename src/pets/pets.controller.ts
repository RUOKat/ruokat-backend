import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import {
  CreateCatProfileDto,
  UpdateCatProfileDto,
} from './dto/cat-profile.dto';
import { CognitoAuthGuard } from '../auth/cognito-auth.guard';
import {
  CurrentUser,
  RequestUser,
} from '../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '@/auth/auth.service';
import e from 'express';

@ApiBearerAuth('access-token')
@ApiTags('pets')
@UseGuards(CognitoAuthGuard)
@Controller('pets')
export class PetsController {
  constructor(
    private readonly petsService: PetsService,
    private readonly authService: AuthService,
  ) { }

  @Post()
  @ApiOperation({
    summary: `Create a pet's profile`,
    description: '고양이 프로필을 생성합니다. (PostgreSQL 저장 + AI 분석용 DynamoDB 동기화)'
  })
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateCatProfileDto,
  ) {
    const exUser = await this.authService.getUserBySub(user.sub);
    if (!exUser) {
      throw new NotFoundException('User not found');
    }
    return this.petsService.create(exUser.id, dto);
  }

  @Get()
  @ApiOperation({ summary: `Get all of my pets' profiles` })
  async findMyPets(@CurrentUser() user: RequestUser) {
    const exUser = await this.authService.getUserBySub(user.sub);
    if (!exUser) {
      throw new NotFoundException('User not found');
    }
    return this.petsService.findAllByUser(exUser.id);
  }

  @Put(':id')
  @ApiOperation({
    summary: `Update a pet's profile`,
    description: '고양이 프로필을 수정합니다. 수정 이력은 AI 분석을 위해 DynamoDB에 기록됩니다.'
  })
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCatProfileDto,
  ) {
    const exUser = await this.authService.getUserBySub(user.sub);
    if (!exUser) {
      throw new NotFoundException('User not found');
    }
    return this.petsService.update(exUser.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: `Delete a pet's profile` })
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const exUser = await this.authService.getUserBySub(user.sub);
    if (!exUser) {
      throw new NotFoundException('User not found');
    }
    return this.petsService.softDelete(exUser.id, id);
  }

  @Get(':id/petcam-images')
  @ApiOperation({
    summary: '펫캠 이미지 목록 조회',
    description: 'S3 버킷에서 해당 고양이의 펫캠 이미지를 최신순으로 조회합니다.'
  })
  async getPetcamImages(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const exUser = await this.authService.getUserBySub(user.sub);
    if (!exUser) {
      throw new NotFoundException('User not found');
    }
    return this.petsService.getPetcamImages(id);
  }
}

// Admin 전용 컨트롤러 (인증 없음)
@ApiTags('admin')
@Controller('admin/pets')
export class AdminPetsController {
  constructor(private readonly petsService: PetsService) { }

  @Get()
  @ApiOperation({ summary: '전체 고양이 목록 조회 (Admin)' })
  async findAllPets() {
    return this.petsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '고양이 상세 조회 (Admin)' })
  async findOnePet(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.petsService.findOne(id);
  }
}