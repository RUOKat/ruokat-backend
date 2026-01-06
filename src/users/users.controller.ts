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
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';

interface UpdateAlarmSettingsDto {
  enabled: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: any;
}

@UseGuards(CognitoAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: RequestUser) {
    return this.usersService.getMe(user.sub);
  }

  @Put('me')
  async updateMe(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateMe(user.sub, dto);
  }

  @Get('me/alarms')
  async getMyAlarms(@CurrentUser() user: RequestUser) {
    return this.usersService.getAlarmSettings(user.sub);
  }

  @Put('me/alarms')
  async updateMyAlarms(
    @CurrentUser() user: RequestUser,
    @Body() body: UpdateAlarmSettingsDto,
  ) {
    return this.usersService.updateAlarmSettings(user.sub, body);
  }

  @Delete('me/alarms')
  async disableMyAlarms(@CurrentUser() user: RequestUser) {
    return this.usersService.disableAlarms(user.sub);
  }
}


