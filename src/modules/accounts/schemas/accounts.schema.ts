import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccountDocument = Account & Document;

@Schema({ timestamps: true })
export class Account {
  @Prop({ required: true, ref: 'User', type: Types.ObjectId })
  userId!: Types.ObjectId;

  @Prop({ required: true, type: String })
  bankName!: string;

  @Prop({ required: true, type: String })
  transferRecipientCode!: string;

  @Prop({ required: true, type: String })
  accountNumber!: string;

  @Prop({ required: true, type: String })
  accountName!: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
