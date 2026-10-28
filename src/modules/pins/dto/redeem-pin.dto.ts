import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class RedeemPinDto {
  @ApiProperty({
    description: 'This is the 12 digit PIN of the user.',
  })
  @IsString()
  @Matches(/^\d{12}$/, {
    message: 'PIN must contain exactly 12 digits.',
  })
  @MaxLength(12)
  pin!: string;
}
