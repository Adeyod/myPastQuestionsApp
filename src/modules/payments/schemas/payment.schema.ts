import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PlanCode } from '../../plans/schemas/plan.schema';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum WebhookProcessionTransactionType {
  PAYMENT = 'PAYMENT',
  WITHDRAWAL = 'WITHDRAWAL',
}

export enum PaymentProvider {
  PAYSTACK = 'paystack',
  // FLUTTERWAVE = 'flutterwave',
}
@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: PlanCode })
  plan!: PlanCode;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ required: true })
  amountInKobo!: number; // store in kobo

  @Prop({ required: true, unique: true })
  reference!: string; // internal reference

  @Prop()
  providerReference!: string; // paystack or other provider reference

  @Prop()
  authorizationUrl!: string; // paystack or other provider authorization_url

  @Prop({
    type: String,
    enum: PaymentProvider,
    default: PaymentProvider.PAYSTACK,
  })
  provider!: PaymentProvider;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Prop({
    default: false,
  })
  verified!: boolean;

  @Prop({ type: Object })
  metadata!: Record<string, any>; // flexible (store raw response if needed)

  @Prop({ default: null })
  paidAt!: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({
  userId: 1,
  plan: 1,
  status: 1,
  expiresAt: 1,
});

PaymentSchema.index({ providerReference: 1 });
