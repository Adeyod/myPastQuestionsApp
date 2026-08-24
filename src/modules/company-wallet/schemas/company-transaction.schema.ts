import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  CompanyTransactionCategory,
  CompanyTransactionType,
} from '../enums/company-transaction.enum';

export type CompanyTransactionDocument = HydratedDocument<CompanyTransaction>;

@Schema({ timestamps: true })
export class CompanyTransaction {
  @Prop({
    type: Types.ObjectId,
    ref: 'CompanyWallet',
    required: true,
  })
  companyWalletId!: Types.ObjectId;

  @Prop({ required: true })
  amountInKobo!: number;

  @Prop({
    type: String,
    enum: CompanyTransactionType,
    required: true,
  })
  type!: CompanyTransactionType;

  @Prop({
    type: String,
    enum: CompanyTransactionCategory,
    required: true,
  })
  category!: CompanyTransactionCategory;

  @Prop({ required: true })
  description!: string;

  @Prop({ unique: true, required: true })
  reference!: string;

  // Useful for identifying who generated the revenue
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  userId?: Types.ObjectId;

  @Prop({
    type: Object,
    default: {},
  })
  metadata?: Record<string, any>;
}

export const CompanyTransactionSchema =
  SchemaFactory.createForClass(CompanyTransaction);
