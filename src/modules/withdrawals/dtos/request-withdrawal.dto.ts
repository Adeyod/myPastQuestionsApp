import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class RequestWithdrawalDto {
  @ApiProperty({
    description:
      'This is the amount of money that the user want to withdraw from his wallet.',
    example: 5000,
  })
  @IsNumber()
  @Min(1000) // ₦1 minimum (1000000 kobo)
  amountInKobo!: number;

  @ApiProperty({
    description: 'This is the wallet address of the user that is withdrawing.',
    example: '39ek48j38ej4e837ewy3h4b3ue8',
  })
  @IsNotEmpty()
  @IsString()
  walletId!: string;
}
