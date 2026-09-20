import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum ParticipantStatus {
  REGISTERED = 'REGISTERED',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_ROOM = 'IN_ROOM',
  TIE_BREAK = 'TIE_BREAK',
  QUALIFIED = 'QUALIFIED',
  ELIMINATED = 'ELIMINATED',
  COMPLETED = 'COMPLETED',
  DISQUALIFIED = 'DISQUALIFIED',
}

export type QuizParticipantDocument = HydratedDocument<QuizParticipant>;

@Schema({ timestamps: true })
export class QuizParticipant {
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true, index: true })
  quizId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: ParticipantStatus,
    default: ParticipantStatus.REGISTERED,
  })
  status!: ParticipantStatus;

  @Prop({ type: Number, default: 1 })
  currentRound!: number;

  @Prop({ type: Number, default: 0 })
  totalScore!: number;

  @Prop({ type: Number, default: 0 })
  totalTimeTakenInSeconds!: number;

  @Prop({ type: Number, default: 0 })
  rewardEarned!: number;

  @Prop({ type: Number, default: null })
  finalPosition?: number | null;

  @Prop({ type: Number, default: null })
  eliminatedInRound?: number | null;

  @Prop({ type: String, default: null })
  socketId?: string | null;

  @Prop({ type: Boolean, default: false })
  connected!: boolean;

  @Prop({ type: Date, default: null })
  disconnectedAt?: Date | null;
}

export const QuizParticipantSchema =
  SchemaFactory.createForClass(QuizParticipant);
QuizParticipantSchema.index({ quizId: 1, userId: 1 }, { unique: true });
