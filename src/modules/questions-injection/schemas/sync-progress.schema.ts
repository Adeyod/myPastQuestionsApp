import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SyncProgressDocument = SyncProgress & Document;

@Schema({ timestamps: true })
export class SyncProgress {
  @Prop({ required: true })
  subject!: Types.ObjectId;

  @Prop({ required: true })
  year!: number;

  @Prop({ default: 1 })
  page!: number;

  @Prop({ default: false })
  completed!: boolean;
}

export const SyncProgressSchema = SchemaFactory.createForClass(SyncProgress);
