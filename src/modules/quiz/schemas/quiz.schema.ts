import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum QuizStatus {
  DRAFT = 'DRAFT',
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Schema({ _id: false })
export class DifficultyBreakdown {
  @Prop({ required: true, default: 0 })
  easy!: number;

  @Prop({ required: true, default: 0 })
  medium!: number;

  @Prop({ required: true, default: 0 })
  hard!: number;
}

@Schema({ _id: false })
export class RoundInformation {
  @Prop({ required: true })
  round_number!: number;

  @Prop({ required: true })
  no_of_questions!: number;

  @Prop({ required: true, type: DifficultyBreakdown })
  difficultyBreakdown!: DifficultyBreakdown;

  @Prop({ required: true })
  exit_number!: number;

  @Prop({ required: true, default: 0 })
  exit_reward!: number;
}

export type QuizDocument = Quiz & Document;

@Schema({ timestamps: true })
export class Quiz {
  @Prop({ required: true })
  quiz_title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, enum: QuizStatus, default: QuizStatus.DRAFT })
  status!: QuizStatus;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Subject' })
  subject!: Types.ObjectId;

  @Prop({ required: true })
  time_per_question!: number; // in seconds

  @Prop({ required: true })
  start_date!: Date;

  @Prop({ required: true })
  no_of_contestants!: number;

  @Prop({ required: true })
  number_of_rounds!: number;

  @Prop({ required: true, type: [RoundInformation] })
  round_information!: RoundInformation[];

  @Prop({ required: true, default: 0 })
  first_position_reward!: number;

  @Prop({ required: true, default: 0 })
  second_position_reward!: number;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
