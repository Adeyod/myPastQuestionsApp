import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { TokenPurpose } from '../schemas/token.schema';

export class TokenCreationDto {
  @ApiProperty({
    description: 'user ID',
    example: '1029382719',
  })
  userId!: Types.ObjectId;

  @ApiProperty({
    description: 'Token purpose',
    example: 'EMAIL_VERIFICATION',
  })
  purpose!: TokenPurpose;
}
