// src/users/users.service.ts

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

export interface AlarmSettings {
  enabled: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: any;
}

@Injectable()
export class UsersService {
  // [Logger] 시스템 로그 관리를 위해 Logger 인스턴스 생성
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // [수정] 내 정보 조회 (DB 데이터 + 프론트엔드용 가짜 데이터 병합)
  async getMe(sub: string) {
    const user = await this.prisma.user.findUnique({
      where: { sub },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // DB에 없는 필드를 코드에서 강제로 합쳐서 내보냅니다 (Mocking)
    return {
      ...user,
      // [Mock] 프론트엔드 변수명 profilePhoto 대응 (DB엔 아직 없음)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profilePhoto: (user as any).profileImage || null,
      // [Mock] 연락처 (DB엔 아직 없음)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      phone: (user as any).phone || null,
      // [Mock] 고양이 목록 (DB 관계 연결 전까지 빈 배열 전송)
      pets: [],
      // [Fallback] 알림 설정 기본값
      alarmsEnabled: user.alarmsEnabled ?? true,
      alarmConfig: user.alarmConfig ?? { priority: 'important' },
    };
  }

  // [수정] 내 정보 수정
  async updateMe(sub: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { sub } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // [중요] DB 스키마에 없는 필드(phone, profilePhoto)가 들어오면
    // Prisma가 에러를 뱉으므로, 존재하는 필드(name)만 골라서 업데이트합니다.
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: dto.name,
        // phone: dto.phone, // DB 컬럼 생기면 주석 해제
        // profileImage: dto.profilePhoto // DB 컬럼 생기면 주석 해제
      },
    });

    // 응답은 프론트엔드가 보낸 값을 그대로 반영해서 "마치 저장된 것처럼" 리턴
    return {
      ...updatedUser,
      profilePhoto: dto.profilePhoto || null,
      phone: dto.phone || null,
      pets: [],
    };
  }

  // [신규] 비밀번호 변경 (Mock - 실제 로직은 AWS Cognito 연동 필요)
  async changePassword(sub: string, dto: ChangePasswordDto) {
    // console.log 대신 Logger 사용 (비밀번호 값은 보안상 로그에 남기지 않음)
    this.logger.log(`[Mock] 비밀번호 변경 요청 - User: ${sub}`);
    
    // TODO: AWS SDK를 사용하여 Cognito 비밀번호 변경 API 호출
    
    return { success: true, message: '비밀번호가 변경되었습니다.' };
  }

  // [신규] 계정 삭제 (Mock)
  async deleteAccount(sub: string) {
    this.logger.warn(`[Mock] 계정 삭제 요청 - User: ${sub}`);
    
    const user = await this.prisma.user.findUnique({ where: { sub } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // TODO: 1. Prisma에서 유저 삭제
    // await this.prisma.user.delete({ where: { id: user.id } });

    // TODO: 2. AWS Cognito에서 유저 삭제
    
    return { success: true, message: '계정이 삭제되었습니다.' };
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
    
    // DB 컬럼이 없을 경우를 대비한 try-catch
    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          alarmsEnabled: settings.enabled,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          alarmConfig: settings.config,
        },
      });
    } catch (e) {
      this.logger.warn(`알림 설정 저장 실패(DB컬럼 부재 가능성): ${e}`);
    }
    
    return {
      enabled: settings.enabled,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      config: settings.config,
    };
  }

  async disableAlarms(sub: string): Promise<AlarmSettings> {
    const user = await this.prisma.user.findUnique({
      where: { sub },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          alarmsEnabled: false,
        },
      });
    } catch(e) {
        // 무시
    }

    return {
      enabled: false,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      config: user.alarmConfig,
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany();
  }
}