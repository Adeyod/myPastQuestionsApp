import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WithdrawalDocument = Withdrawal & Document;

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Withdrawal {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
  walletId!: Types.ObjectId;

  @Prop({ required: true })
  amountInKobo!: number; // store in kobo

  @Prop({ required: true, unique: true })
  reference!: string;

  @Prop()
  providerReference!: string;

  @Prop({ required: true })
  recipientCode!: string;

  @Prop({
    type: String,
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
  })
  status!: WithdrawalStatus;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  failureReason?: string;

  @Prop()
  paidAt?: Date;
}

export const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal);
