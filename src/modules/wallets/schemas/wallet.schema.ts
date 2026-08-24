import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ default: 0 })
  balanceInKobo!: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

WalletSchema.index({ userId: 1 }, { unique: true });
