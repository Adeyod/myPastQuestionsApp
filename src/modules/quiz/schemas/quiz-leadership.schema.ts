import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: false })
export class LeaderboardEntry {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  score!: number;

  @Prop({ required: true, default: 0 })
  timeTakenInSeconds!: number;

  @Prop({ required: true, default: 0 })
  rank!: number;

  @Prop({ required: true, default: false })
  isEliminated!: boolean;

  @Prop({ required: true, default: false })
  isTied!: boolean;
}

export type QuizLeaderboardDocument = HydratedDocument<QuizLeaderboard>;

@Schema({ timestamps: true })
export class QuizLeaderboard {
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true, index: true })
  quizId!: Types.ObjectId;

  @Prop({ required: true })
  roundNumber!: number;

  @Prop({ type: [LeaderboardEntry], required: true })
  entries!: LeaderboardEntry[];

  @Prop({ default: false })
  hasTieBreakOccurred!: boolean;
}

export const QuizLeaderboardSchema =
  SchemaFactory.createForClass(QuizLeaderboard);
QuizLeaderboardSchema.index({ quizId: 1, roundNumber: 1 }, { unique: true });
