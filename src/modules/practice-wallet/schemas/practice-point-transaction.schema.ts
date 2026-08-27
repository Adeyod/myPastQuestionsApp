import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PracticePointTransactionDocument =
  HydratedDocument<PracticePointTransaction>;

export enum PracticePointTransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum PracticePointTransactionCategory {
  PRACTICE_REWARD = 'PRACTICE_REWARD',
  SOLVE_AND_WIN_ENTRY = 'SOLVE_AND_WIN_ENTRY',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
}

@Schema({ timestamps: true })
export class PracticePointTransaction {
  @Prop({
    type: Types.ObjectId,
    ref: 'PracticeWallet',
    required: true,
    index: true,
  })
  practiceWalletId!: Types.ObjectId;

  @Prop({
    required: true,
  })
  points!: number;

  @Prop({
    type: String,
    enum: PracticePointTransactionType,
    required: true,
  })
  type!: PracticePointTransactionType;

  @Prop({
    type: String,
    enum: PracticePointTransactionCategory,
    required: true,
  })
  category!: PracticePointTransactionCategory;

  @Prop({
    type: String,
    required: true,
  })
  description!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Practice',
  })
  practiceId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'SolveAndWinContest',
  })
  contestId?: Types.ObjectId;
}

export const PracticePointTransactionSchema = SchemaFactory.createForClass(
  PracticePointTransaction,
);
