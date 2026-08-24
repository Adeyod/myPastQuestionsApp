import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum TransactionCategoryEnum {
  GENERAL = 'GENERAL',
  REFERRAL_BONUS = 'REFERRAL_BONUS',
  PRACTICE_QUESTION = 'PRACTICE_QUESTION',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
  walletId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Withdrawal' })
  withdrawalId?: Types.ObjectId;

  @Prop({ required: true })
  amountInKobo!: number;

  @Prop({ type: String, enum: TransactionType, required: true })
  type!: TransactionType;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({
    type: String,
    enum: TransactionCategoryEnum,
    default: TransactionCategoryEnum.GENERAL,
  })
  category!: TransactionCategoryEnum;

  // NEW: who triggered this bonus
  @Prop({ type: Types.ObjectId, ref: 'User' })
  referredUserId?: Types.ObjectId;

  // NEW: level (1, 2, 3)
  @Prop()
  referralLevel?: number;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
