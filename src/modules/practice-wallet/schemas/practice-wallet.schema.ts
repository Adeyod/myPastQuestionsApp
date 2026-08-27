import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PracticeWalletDocument = HydratedDocument<PracticeWallet>;

@Schema({ timestamps: true })
export class PracticeWallet {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: Number,
    default: 0,
  })
  points!: number;
}

export const PracticeWalletSchema =
  SchemaFactory.createForClass(PracticeWallet);
