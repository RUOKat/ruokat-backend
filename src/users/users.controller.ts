import {
  Controller,
  Delete,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CognitoAuthGuard } from '../auth/cognito-auth.guard';
import {
  CurrentUser,
  RequestUser,
} from '../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateAlarmSettingsDto } from './dto/update-alarm-settings.dto';

@ApiBearerAuth()
@ApiTags('users')
@UseGuards(CognitoAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user information' })
  async getMe(@CurrentUser() user: RequestUser) {
    return this.usersService.getMe(user.sub);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user information' })
  async updateMe(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateMe(user.sub, dto);
  }

  @Get('me/alarms')
  @ApiOperation({ summary: `Get current user's alarm settings` })
  async getMyAlarms(@CurrentUser() user: RequestUser) {
    return this.usersService.getAlarmSettings(user.sub);
  }

  @Put('me/alarms')
  @ApiOperation({ summary: `Update current user's alarm settings` })
  async updateMyAlarms(
    @CurrentUser() user: RequestUser,
    @Body() body: UpdateAlarmSettingsDto,
  ) {
    return this.usersService.updateAlarmSettings(user.sub, body);
  }

  @Delete('me/alarms')
  @ApiOperation({ summary: `Disable current user's alarms` })
  async disableMyAlarms(@CurrentUser() user: RequestUser) {
    return this.usersService.disableAlarms(user.sub);
  }
}


