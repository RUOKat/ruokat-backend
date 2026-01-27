import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateUserProfileDto {
  // 1. 기본 정보
  @ApiProperty({ description: '사용자 이름', required: false, example: '김집사' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '사용자 닉네임', required: false, example: '냥냥펀치' })
  @IsOptional()
  @IsString()
  nickname?: string;

  // 2. 연락처 및 주소 (새로 추가됨!)
  @ApiProperty({ description: '연락처 (예: 010-0000-0000)', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
  // 💡 주의: 프론트는 'phone'으로 보내고, DB는 'phoneNumber'입니다. 서비스에서 연결해줘야 함.

  @ApiProperty({ description: '주소 (서울시 강남구...)', required: false })
  @IsOptional()
  @IsString()
  address?: string; // 👈 프론트엔드의 address와 매칭

  // 3. 프로필 이미지
  @ApiProperty({ description: '프로필 이미지 URL', required: false })
  @IsOptional()
  @IsString()
  profilePhoto?: string;

  // 4. 설정 (새로 추가됨!)
  @ApiProperty({ description: '알림 전체 수신 여부', required: false })
  @IsOptional()
  @IsBoolean()
  alarmsEnabled?: boolean; // 👈 프론트의 'notificationsEnabled'를 받을 곳

  @ApiProperty({ description: '알림 상세 설정 (JSON)', required: false })
  @IsOptional()
  @IsObject() // JSON 객체 허용
  alarmConfig?: any; // 👈 프론트의 'alertPriority' 등을 저장할 곳

  // 5. 카메라 설정
  @ApiProperty({ description: '카메라 사용 설정', required: false })
  @IsOptional()
  @IsBoolean()
  cameraEnabled?: boolean;
}