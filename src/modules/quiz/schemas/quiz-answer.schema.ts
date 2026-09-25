import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QuizAnswerDocument = HydratedDocument<QuizAnswer>;

@Schema({ timestamps: true })
export class QuizAnswer {
  @Prop({
    type: Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true,
  })
  quizId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'QuizRoom',
    required: true,
    index: true,
  })
  roomId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
  })
  questionId!: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    index: true,
  })
  roundNumber!: number;

  @Prop({
    type: Types.ObjectId,
    required: true,
  })
  selectedAnswerId!: Types.ObjectId;

  @Prop({
    type: Boolean,
    required: true,
  })
  isCorrect!: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isFirstCorrectAnswer!: boolean;

  @Prop({
    type: Number,
    default: 0,
  })
  scoreAwarded!: number;

  @Prop({
    type: Number,
    required: true,
  })
  timeTakenInSeconds!: number;

  @Prop({
    type: Date,
    required: true,
  })
  answeredAt!: Date;
}

export const QuizAnswerSchema = SchemaFactory.createForClass(QuizAnswer);

QuizAnswerSchema.index(
  {
    quizId: 1,
    roundNumber: 1,
    userId: 1,
    questionId: 1,
  },
  { unique: true },
);
