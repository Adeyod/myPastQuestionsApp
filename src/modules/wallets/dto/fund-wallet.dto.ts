import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class FundUserWalletDto {
  @ApiProperty({
    description:
      'This is the amount that will be credited to the wallet account. It must be in kobo',
    example: 50000,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber()
  amountInKobo!: number;
}
