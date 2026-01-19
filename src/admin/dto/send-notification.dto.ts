import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendNotificationByEmailDto {
  @ApiProperty({ description: '수신자 이메일' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: '알림 제목' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: '알림 내용' })
  @IsString()
  @IsNotEmpty()
  body!: string;
}

export class SendNotificationByPetIdDto {
  @ApiProperty({ description: '펫 ID' })
  @IsUUID()
  @IsNotEmpty()
  petId!: string;

  @ApiProperty({ description: '알림 제목' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: '알림 내용' })
  @IsString()
  @IsNotEmpty()
  body!: string;
}
