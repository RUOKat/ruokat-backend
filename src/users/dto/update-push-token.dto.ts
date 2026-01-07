import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdatePushTokenDto {
  @IsString()
  pushToken: string;

  @IsOptional()
  @IsObject()
  deviceInfo?: object;
}
