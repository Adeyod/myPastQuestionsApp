import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { PlanCode } from '../../plans/schemas/plan.schema';
import { PaymentProvider, PaymentStatus } from '../schemas/payment.schema';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Payment ID',
    example: 'ei3392ue8394jf9550dj49fj',
  })
  _id!: Types.ObjectId;

  @ApiProperty({
    description: 'ID of the user that made the payment.',
    example: 'ei3392ue8394jf9550dj49fj',
  })
  userId!: Types.ObjectId;

  @ApiProperty({
    description: 'This refers to the plan that the student is paying for.',
    example: PlanCode.SECONDARY,
  })
  plan!: PlanCode;

  @ApiProperty({
    description: 'Amount paid In kobo',
    example: 2000,
  })
  amountInKobo!: number;

  @ApiProperty({
    description:
      'This is our internal reference used to make the payment on the payment processor.',
    example: 'PAYMENT_SECONDARY_ei3392ue8394jf9550dj49fj_1711465234567',
  })
  reference!: string;

  @ApiProperty({
    description:
      'This is the reference that payment provider give to the transaction.',
    example: '2o0du3p07h',
  })
  providerReference!: string;

  @ApiProperty({
    description: 'This is the payment authorization URL',
    example: 'https://checkout.paystack.com/x7qp2pjf6verkwv',
  })
  authorizationUrl!: string;

  @ApiProperty({
    description: 'This is the name of the payment provider.',
    example: 'paystack',
  })
  provider!: PaymentProvider;

  @ApiProperty({
    description: 'This is the status of the payment transaction.',
    example: 'PENDING',
  })
  status!: PaymentStatus;

  @ApiProperty({
    description:
      'This is a boolean to confirm if the payment is verified or not.',
    example: true,
  })
  verified!: boolean;

  @ApiProperty({
    description: 'This is other parameters that we added to the API call.',
    example: {
      userId: 'ei3392ue8394jf9550dj49fj',
    },
  })
  metadata!: object;

  @ApiProperty({
    description: 'This refers to the time that the payment was confirmed.',
    example: '2025-09-21T06:13:00.031+00:00',
  })
  paidAt!: Date;

  @ApiProperty({
    description: 'This refers to the time that the payment was confirmed.',
    example: '2025-09-21T06:13:00.031+00:00',
  })
  expiresAt!: Date;
}
