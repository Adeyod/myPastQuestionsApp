import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { TransactionCategoryEnum } from '../../transactions/schemas/transaction.schema';

export class WalletCreditDto {
  @ApiProperty({
    description: 'The wallet ID for the wallet to be credited',
    example: '45q9fak342d32284fak3841q',
  })
  @IsNotEmpty({ message: 'Wallet ID is required' })
  @IsString({ message: 'Wallet ID must be a string' })
  walletId!: string;

  @ApiProperty({
    description:
      'This is the amount that will be credited to the wallet account. It must be in kobo',
    example: 50000,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber()
  amountInKobo!: number;

  @ApiProperty({
    description: 'This is the narration of what the amount is meant for',
    example: 'Referral bonus',
  })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  description!: string;

  @ApiProperty({
    description: 'This is the reason for the credit',
    example: 'REFERRAL_BONUS',
  })
  @IsNotEmpty({ message: 'Category is required' })
  @IsEnum(TransactionCategoryEnum)
  category!: TransactionCategoryEnum;

  @ApiProperty({
    description:
      'This is the person that got added to the referral network of the owner of the wallet.',
    example: '30ek38ruu38wjf43owi3si',
  })
  @IsNotEmpty({ message: 'Referral user ID is required' })
  referredUserId!: Types.ObjectId;

  @ApiProperty({
    description:
      'This is the level at which the referred person belong to in the referral network of the person that owns the wallet credited.',
    example: 'level2',
  })
  @IsNotEmpty({ message: 'Referal level is required' })
  @IsNumber()
  referralLevel!: number;
}
