import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PlanCode } from '../../plans/schemas/plan.schema';

export type SubjectDocument = Subject & Document;

@Schema({ timestamps: true })
export class Subject {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, default: false })
  hasFreePractice!: boolean;

  @Prop({
    type: [String],
    enum: PlanCode,
    required: true,
    default: [],
  })
  plans!: PlanCode[];
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
