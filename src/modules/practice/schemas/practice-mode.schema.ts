import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PracticeModeDocument = HydratedDocument<PracticeMode>;

@Schema({ timestamps: true })
export class PracticeMode {
  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  name!: string;

  @Prop({
    required: true,
    trim: true,
  })
  description!: string;

  @Prop({
    required: true,
    min: 0,
  })
  timePerQuestion!: number;

  @Prop({
    required: true,
    min: 0,
  })
  awardedPointPerCorrectAnswer!: number;

  @Prop({
    default: true,
  })
  isActive!: boolean;
}

export const PracticeModeSchema = SchemaFactory.createForClass(PracticeMode);
