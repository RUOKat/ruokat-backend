// src/users/users.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';
import { ExpoService } from '@/expo/expo.service';

export interface AlarmSettings {
  enabled: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: any;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expoService: ExpoService,
  ) {}

  // [기존 유지] 푸시 토큰 업데이트
  async updatePushToken(sub: string, dto: UpdatePushTokenDto) {
    if (!this.expoService.isExpoPushToken(dto.pushToken)) {
      throw new BadRequestException('Invalid Expo push token');
    }
    // sub로 유저를 찾고 업데이트 (Prisma가 알아서 처리)
    const user = await this.prisma.user.findUnique({ where: { sub } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        pushToken: dto.pushToken,
        deviceInfo: dto.deviceInfo
      },
    });
  }

  // [수정] 내 정보 조회 (Real DB Data)
  async getMe(sub: string) {
    const user = await this.prisma.user.findUnique({
      where: { sub },
      include: {
        pets: true, // 고양이 목록도 같이 가져오기
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // [중요] 프론트엔드 변수명과 DB 컬럼명이 다른 경우 여기서 매핑
    return {
      ...user,
      // DB: phoneNumber -> Front: phone
      phone: user.phoneNumber, 
      // DB: alarmConfig가 null이면 기본값 제공
      alarmConfig: user.alarmConfig ?? { priority: 'important' },
    };
  }

  // [수정] 내 정보 수정 (Real DB Update)
  async updateMe(sub: string, dto: UpdateUserProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { sub } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // [중요] DTO(phone) -> DB(phoneNumber) 이름 변환
    const { phone, ...rest } = dto;

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...rest, // name, nickname, address, profilePhoto 등은 그대로 저장
        phoneNumber: phone, // phone은 phoneNumber 컬럼에 저장
      },
      include: {
        pets: true,
      }
    });

    // 응답할 때도 프론트엔드가 아는 이름(phone)으로 돌려줌
    return {
      ...updatedUser,
      phone: updatedUser.phoneNumber,
    };
  }

  // [유지] 비밀번호 변경 (Cognito 로직은 별도 AWS SDK 필요)
  async changePassword(sub: string, dto: ChangePasswordDto) {
    this.logger.log(`[Mock] 비밀번호 변경 요청 - User: ${sub}`);
    // 실제 구현 시: AWS Cognito SDK의 changePassword 메서드 호출 필요
    return { success: true, message: '비밀번호가 변경되었습니다.' };
  }

  // [수정] 계정 삭제 (Soft Delete 구현)
  async deleteAccount(sub: string) {
    this.logger.warn(`계정 삭제 요청 - User: ${sub}`);

    const user = await this.prisma.user.findUnique({ where: { sub } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // DB에서 완전히 지우지 않고 'deletedAt'에 날짜만 기록 (복구 가능성 열어둠)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt: new Date(),
      },
    });

    // TODO: AWS Cognito에서도 유저를 비활성화(Disable) 하거나 삭제하는 로직 추가 권장

    return { success: true, message: '계정이 삭제되었습니다.' };
  }

  // [수정] 알림 설정 조회 (DB 직접 조회)
  async getAlarmSettings(sub: string): Promise<AlarmSettings> {
    const user = await this.prisma.user.findUnique({ where: { sub } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return {
      enabled: user.alarmsEnabled,
      config: user.alarmConfig,
    };
  }

  // [수정] 알림 설정 수정 (DB 직접 수정)
  async updateAlarmSettings(
    sub: string,
    settings: AlarmSettings,
  ): Promise<AlarmSettings> {
    const user = await this.prisma.user.findUnique({ where: { sub } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        alarmsEnabled: settings.enabled,
        alarmConfig: settings.config ?? undefined,
      },
    });

    return {
      enabled: updatedUser.alarmsEnabled,
      config: updatedUser.alarmConfig,
    };
  }

  // [수정] 알림 끄기
  async disableAlarms(sub: string): Promise<AlarmSettings> {
    const user = await this.prisma.user.findUnique({ where: { sub } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        alarmsEnabled: false,
      },
    });

    return {
      enabled: updatedUser.alarmsEnabled,
      config: updatedUser.alarmConfig,
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany();
  }
}