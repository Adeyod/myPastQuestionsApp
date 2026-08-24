import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { TransactionType } from '../schemas/transaction.schema';

export class TransactionResponseDto {
  @ApiProperty({
    description: 'ID of the JSON object.',
    example: '2039wj4r5j39wj58fh5i',
  })
  _id!: Types.ObjectId;

  @ApiProperty({
    description: 'Wallet ID that the transaction belongs to.',
    example: '2039wj4r5j39wj58fh5i',
  })
  walletId!: Types.ObjectId;

  @ApiProperty({
    description: 'The amount transacted',
    example: 50,
  })
  amountInKobo!: number;

  @ApiProperty({
    description: 'The type of transaction done.',
    example: TransactionType.CREDIT,
  })
  type!: TransactionType;

  @ApiProperty({
    description: 'What the transaction is meant for.',
    example: 'Referral bonus',
  })
  description!: string;
}
