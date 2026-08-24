import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum PlanCode {
  SECONDARY = 'SECONDARY',
  TERTIARY = 'TERTIARY',
  OTHERS = 'OTHERS',
}

export type PlanDocument = HydratedDocument<Plan>;

@Schema({ timestamps: true })
export class Plan {
  @Prop({ required: true, unique: true })
  categoryId!: string; // e.g. "secondary"

  @Prop({ required: true, enum: PlanCode, unique: true })
  code!: PlanCode;

  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ default: true })
  isPremium!: boolean;

  /**
   * Price to be converted to kobo
   * Stored in kobo.
   *
   * Example:
   * 300000 = ₦3000
   */
  @Prop({ required: true, min: 0 })
  priceInKobo!: number;

  @Prop({ default: true })
  isActive!: boolean;

  /**
   * Price charged for one practice question.
   * Stored in kobo.
   *
   * Example:
   * 1000 = ₦10
   */
  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  pricePerPracticeQuestionInKobo!: number;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
