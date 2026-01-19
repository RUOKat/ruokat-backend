import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  SendNotificationByEmailDto,
  SendNotificationByPetIdDto,
} from './dto/send-notification.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Post('notifications/by-email')
  @ApiOperation({ summary: '이메일로 푸시 알림 전송' })
  async sendNotificationByEmail(@Body() dto: SendNotificationByEmailDto) {
    return this.adminService.sendNotificationByEmail(
      dto.email,
      dto.title,
      dto.body,
    );
  }

  @Post('notifications/by-pet')
  @ApiOperation({ summary: '펫 ID로 해당 펫 주인에게 푸시 알림 전송' })
  async sendNotificationByPetId(@Body() dto: SendNotificationByPetIdDto) {
    return this.adminService.sendNotificationByPetId(
      dto.petId,
      dto.title,
      dto.body,
    );
  }
}
