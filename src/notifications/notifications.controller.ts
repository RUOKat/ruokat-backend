import { Controller, Get, Patch, Param, UseGuards, Req, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CognitoAuthGuard } from '../auth/cognito-auth.guard';
import { CreateNotificationDto } from './dto/create-notification.dto'; // 👈 DTO import
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(CognitoAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Req() req: any) {
    return this.notificationsService.getMyNotifications(req.user.userId || req.user.sub);
  }

  @Patch(':id/read')
  async readNotification(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.userId || req.user.sub);
  }

  // 👇 DTO 적용된 부분
  @Post('test')
  async createTest(@Req() req: any, @Body() body: CreateNotificationDto) {
    return this.notificationsService.createNotification(
      req.user.userId || req.user.sub,
      body.title,
      body.body
    );
  }
}