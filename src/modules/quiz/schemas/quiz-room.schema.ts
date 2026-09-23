import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum QuizRoomStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  ROUND_IN_PROGRESS = 'ROUND_IN_PROGRESS',
  ROUND_COMPLETED = 'ROUND_COMPLETED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export type QuizRoomDocument = HydratedDocument<QuizRoom>;

@Schema({ timestamps: true })
export class QuizRoom {
  @Prop({
    type: Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true,
  })
  quizId!: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  roomId!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  hostId!: Types.ObjectId;

  @Prop({
    enum: QuizRoomStatus,
    default: QuizRoomStatus.WAITING,
  })
  status!: QuizRoomStatus;

  @Prop({ default: 0 })
  currentRound!: number;

  @Prop({ default: -1 })
  currentQuestionIndex!: number;

  @Prop({ type: Date })
  questionStartedAt?: Date;

  @Prop({ type: Date })
  questionEndsAt?: Date;

  @Prop({
    type: [
      {
        userId: {
          type: Types.ObjectId,
          ref: 'User',
        },
        socketId: String,
        joinedAt: Date,
        connected: Boolean,
      },
    ],
    default: [],
  })
  participants!: any[];

  @Prop({
    type: [Types.ObjectId],
    ref: 'User',
    default: [],
  })
  spectators!: Types.ObjectId[];
}

export const QuizRoomSchema = SchemaFactory.createForClass(QuizRoom);
