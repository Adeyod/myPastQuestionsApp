import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SolveAndWinParticipationDocument =
  HydratedDocument<SolveAndWinParticipation>;

export enum SolveAndWinParticipationStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISQUALIFIED = 'DISQUALIFIED',
}

@Schema({ _id: false })
export class ParticipationQuestion {
  @Prop({
    type: Types.ObjectId,
    ref: 'SolveAndWinQuestion',
    required: true,
  })
  questionId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Subject',
    required: true,
  })
  subjectId!: Types.ObjectId;

  @Prop({
    type: String,
    default: null,
  })
  selectedAnswer?: string | null;

  @Prop({
    type: Boolean,
    default: null,
  })
  isCorrect?: boolean | null;

  @Prop({
    default: 0,
  })
  marksAwarded!: number;
}

@Schema({ _id: false })
export class ParticipationSubject {
  @Prop({
    type: Types.ObjectId,
    ref: 'Subject',
    required: true,
  })
  subjectId!: Types.ObjectId;

  @Prop({
    type: [ParticipationQuestion],
    default: [],
  })
  questions!: ParticipationQuestion[];

  @Prop({
    default: 0,
  })
  correctAnswers!: number;

  @Prop({
    default: 0,
  })
  wrongAnswers!: number;

  @Prop({
    default: 0,
  })
  unansweredQuestions!: number;

  @Prop({
    default: 0,
  })
  score!: number;
}

@Schema({ timestamps: true })
export class SolveAndWinParticipation {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'SolveAndWinContest',
    required: true,
    index: true,
  })
  contestId!: Types.ObjectId;

  @Prop({
    type: [ParticipationSubject],
    default: [],
  })
  subjects!: ParticipationSubject[];

  @Prop({
    default: 0,
  })
  totalQuestions!: number;

  @Prop({
    default: 0,
  })
  correctAnswers!: number;

  @Prop({
    default: 0,
  })
  wrongAnswers!: number;

  @Prop({
    default: 0,
  })
  unansweredQuestions!: number;

  @Prop({
    default: 0,
  })
  score!: number;

  @Prop({
    default: 0,
  })
  percentage!: number;

  @Prop({
    default: 0,
  })
  pointsSpent!: number;

  @Prop({
    default: 0,
  })
  durationInSeconds!: number;

  @Prop({
    type: String,
    enum: SolveAndWinParticipationStatus,
    default: SolveAndWinParticipationStatus.IN_PROGRESS,
    index: true,
  })
  status!: SolveAndWinParticipationStatus;

  @Prop()
  startedAt?: Date;

  @Prop()
  submittedAt?: Date;
}

export const SolveAndWinParticipationSchema = SchemaFactory.createForClass(
  SolveAndWinParticipation,
);

SolveAndWinParticipationSchema.index({
  userId: 1,
  contestId: 1,
});

SolveAndWinParticipationSchema.index({
  contestId: 1,
  status: 1,
});
