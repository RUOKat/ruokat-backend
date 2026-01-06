import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

export interface AlarmSettings {
  enabled: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: any;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(sub: string) {
    const user = await this.prisma.user.findUnique({
      where: { sub },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateMe(sub: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { sub },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { id: user.id },
      data: dto,
    });
  }

  async getAlarmSettings(sub: string): Promise<AlarmSettings> {
    const user = await this.prisma.user.findUnique({
      where: { sub },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      enabled: user.alarmsEnabled,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      config: user.alarmConfig,
    };
  }

  async updateAlarmSettings(
    sub: string,
    settings: AlarmSettings,
  ): Promise<AlarmSettings> {
    const user = await this.prisma.user.findUnique({
      where: { sub },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        alarmsEnabled: settings.enabled,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        alarmConfig: settings.config,
      },
    });
    return {
      enabled: updated.alarmsEnabled,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      config: updated.alarmConfig,
    };
  }

  async disableAlarms(sub: string): Promise<AlarmSettings> {
    const user = await this.prisma.user.findUnique({
      where: { sub },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        alarmsEnabled: false,
      },
    });
    return {
      enabled: updated.alarmsEnabled,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      config: updated.alarmConfig,
    };
  }
}


