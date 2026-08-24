// session-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty()
  deviceId!: string;

  @ApiProperty()
  deviceName!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  lastActiveAt!: Date;
}
