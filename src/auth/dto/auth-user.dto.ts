import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty()
  sub!: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  name?: string;
}


