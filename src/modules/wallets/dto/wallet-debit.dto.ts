import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class WalletDebitDto {
  @ApiProperty({
    description: 'The wallet ID for the wallet to be debited',
    example: '45q9fak342d32284fak3841q',
  })
  @IsNotEmpty({ message: 'Wallet ID is required' })
  @IsString({ message: 'Wallet ID must be a string' })
  walletId!: string;

  @ApiProperty({
    description:
      'This is the amount that will be debited from the wallet account. This must be in kobo.',
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
}
