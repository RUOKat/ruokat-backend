import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';

@UseGuards(CognitoAuthGuard)
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateCatProfileDto,
  ) {
    return this.petsService.create(user.id ?? user.sub, dto);
  }

  @Get()
  async findMyPets(@CurrentUser() user: RequestUser) {
    return this.petsService.findAllByUser(user.id ?? user.sub);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCatProfileDto,
  ) {
    return this.petsService.update(user.id ?? user.sub, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.petsService.softDelete(user.id ?? user.sub, id);
  }
}


