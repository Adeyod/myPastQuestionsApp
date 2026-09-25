import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: false })
export class LeaderboardEntry {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId!: Types.ObjectId;

  // Points earned during THIS round
  @Prop({
    type: Number,
    required: true,
    default: 0,
  })
  roundScore!: number;

  // Participant's cumulative score after THIS round
  @Prop({
    type: Number,
    required: true,
    default: 0,
  })
  totalScore!: number;

  // Number of questions answered
  @Prop({
    type: Number,
    required: true,
    default: 0,
  })
  answeredQuestions!: number;

  // Number answered correctly
  @Prop({
    type: Number,
    required: true,
    default: 0,
  })
  correctAnswers!: number;

  // Total time spent answering questions in this round
  @Prop({
    type: Number,
    required: true,
    default: 0,
  })
  timeTakenInSeconds!: number;

  // Position in this round
  @Prop({
    type: Number,
    required: true,
    default: 0,
  })
  rank!: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  isTied!: boolean;

  @Prop({
    type: Number,
    default: null,
  })
  tieGroup?: number | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  isEliminated!: boolean;
}

export type QuizLeaderboardDocument = HydratedDocument<QuizLeaderboard>;

@Schema({ timestamps: true })
export class QuizLeaderboard {
  @Prop({
    type: Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true,
  })
  quizId!: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
  })
  roundNumber!: number;

  @Prop({
    type: [LeaderboardEntry],
    default: [],
  })
  entries!: LeaderboardEntry[];

  @Prop({
    type: Boolean,
    default: false,
  })
  hasTie!: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  hasTieBreakOccurred!: boolean;
}

export const QuizLeaderboardSchema =
  SchemaFactory.createForClass(QuizLeaderboard);
QuizLeaderboardSchema.index({ quizId: 1, roundNumber: 1 }, { unique: true });
