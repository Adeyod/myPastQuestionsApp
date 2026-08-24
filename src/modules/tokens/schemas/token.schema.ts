import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TokenDocument = Token & Document;

export enum TokenPurpose {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

@Schema({ timestamps: true })
export class Token {
  @Prop({ required: true, enum: TokenPurpose })
  purpose!: TokenPurpose;

  @Prop({ required: true })
  token!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ required: true, expires: 0 })
  expiresAt!: Date;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
