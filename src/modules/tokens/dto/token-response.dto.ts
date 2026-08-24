import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { TokenPurpose } from '../schemas/token.schema';

export class TokenResponseDto {
  @ApiProperty({
    description: 'Token id',
    example: '2019284jfh830982dh38',
  })
  _id!: Types.ObjectId;

  @ApiProperty({
    description: 'Token purpose. What the token is meant for.',
    example: 'EMAIL_VERIFICATION',
  })
  purpose!: TokenPurpose;

  @ApiProperty({
    description: 'The actual token',
    example: '102938',
  })
  token!: string;

  @ApiProperty({
    description: 'ID of the user that the token is generated for.',
    example: '1029384fheyj458kf472hsy32345',
  })
  user!: Types.ObjectId;

  @ApiProperty({
    description: 'The time that the token will expire.',
    example: '15 mins',
  })
  expiresAt!: Date;
}
