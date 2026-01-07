import { ApiProperty } from '@nestjs/swagger';

export class UpdateAlarmSettingsDto {
  @ApiProperty()
  enabled: boolean;

  @ApiProperty({ required: false })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: any;
}
