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
import {
  CurrentUser,
  RequestUser,
} from '../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('pets')
@UseGuards(CognitoAuthGuard)
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @ApiOperation({ summary: `Create a pet's profile` })
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateCatProfileDto,
  ) {
    return this.petsService.create(user.id ?? user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: `Get all of my pets' profiles` })
  async findMyPets(@CurrentUser() user: RequestUser) {
    return this.petsService.findAllByUser(user.id ?? user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: `Update a pet's profile` })
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCatProfileDto,
  ) {
    return this.petsService.update(user.id ?? user.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: `Delete a pet's profile` })
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.petsService.softDelete(user.id ?? user.sub, id);
  }
}


