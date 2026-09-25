import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QuizQuestionWinnerDocument = HydratedDocument<QuizQuestionWinner>;

@Schema({ timestamps: true })
export class QuizQuestionWinner {
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
    ref: 'User',
    required: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
  })
  scoreAwarded!: number;

  @Prop({
    type: Date,
    required: true,
  })
  awardedAt!: Date;
}

export const QuizQuestionWinnerSchema =
  SchemaFactory.createForClass(QuizQuestionWinner);

QuizQuestionWinnerSchema.index(
  {
    quizId: 1,
    roundNumber: 1,
    questionId: 1,
  },
  { unique: true },
);
