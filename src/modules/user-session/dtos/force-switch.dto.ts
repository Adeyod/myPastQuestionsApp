// force-switch.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ForceSwitchDto {
  @ApiProperty({
    description: 'This is the ID of the user.',
    example: '394ir84736e5362yw7qy3i38',
  })
  @IsString()
  userId!: string;

  @ApiProperty({
    description: 'This is the ID of the device of the user.',
    example: '394ir-84736e5362-yw7qy3i38',
  })
  @IsString()
  deviceId!: string;

  @ApiProperty({
    description: 'This is the name of the device of the user',
    example: 'iPhone 12 Promax',
  })
  @IsString()
  deviceName!: string;
}
