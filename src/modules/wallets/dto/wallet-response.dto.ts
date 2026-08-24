import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class WalletResponseDto {
  @ApiProperty({
    description: 'wallet ID',
    example: '2039difur849e0403e940e9',
  })
  _id!: Types.ObjectId;

  @ApiProperty({
    description: 'user ID',
    example: '2039difur849e0403e940e9',
  })
  userId!: Types.ObjectId;

  @ApiProperty({
    description: 'Balance of the wallet',
    example: 50,
  })
  balanceInKobo!: number;
}
