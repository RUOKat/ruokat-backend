// src/users/account.controller.ts

import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CognitoAuthGuard } from '../auth/cognito-auth.guard'; 
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('account') // Swagger에 'account' 그룹으로 표시
@ApiBearerAuth()
@UseGuards(CognitoAuthGuard)
@Controller('account') // 경로: /api/account
export class AccountController {
  constructor(private readonly usersService: UsersService) {}

  @Post('change-password')
  @ApiOperation({ summary: '비밀번호 변경' })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
  ) {
    // UsersService의 changePassword 메서드 호출
    return this.usersService.changePassword(user.sub, dto);
  }

  @Post('delete')
  @ApiOperation({ summary: '계정 삭제' })
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser() user: RequestUser) {
    // UsersService의 deleteAccount 메서드 호출
    return this.usersService.deleteAccount(user.sub);
  }
}