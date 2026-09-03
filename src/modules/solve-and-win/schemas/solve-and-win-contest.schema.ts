import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SolveAndWinContestDocument = HydratedDocument<SolveAndWinContest>;

export enum SolveAndWinContestStatus {
  DRAFT = 'DRAFT',
  UPCOMING = 'UPCOMING',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Schema({ _id: false })
export class DifficultyBreakdown {
  @Prop({
    type: Number,
    required: true,
    min: 0,
    default: 0,
  })
  easy!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    default: 0,
  })
  medium!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    default: 0,
  })
  hard!: number;
}

@Schema({ _id: false })
export class ContestQuestion {
  @Prop({
    type: Types.ObjectId,
    ref: 'SolveAndWinQuestion',
    required: true,
  })
  questionId!: Types.ObjectId;

  @Prop({
    required: true,
  })
  order!: number;
}

@Schema({ _id: false })
export class ContestSubject {
  @Prop({
    type: Types.ObjectId,
    ref: 'Subject',
    required: true,
  })
  subjectId!: Types.ObjectId;

  @Prop({
    type: Number,
  })
  expectedNoOfQuestions!: number;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  durationInSeconds!: number;

  @Prop({
    type: DifficultyBreakdown,
    required: true,
    default: {
      easy: 0,
      medium: 0,
      hard: 0,
    },
  })
  difficultyBreakdown!: DifficultyBreakdown;

  // @Prop({
  //   type: [ContestQuestion],
  //   default: [],
  // })
  // questions!: ContestQuestion[];
}

@Schema({ timestamps: true })
export class SolveAndWinContest {
  @Prop({
    required: true,
    trim: true,
  })
  title!: string;

  @Prop({
    required: true,
    trim: true,
  })
  description!: string;

  @Prop({
    required: true,
    trim: true,
  })
  category!: string;

  @Prop({
    required: true,
    min: 0,
  })
  amountToBeWonInKobo!: number;

  @Prop({
    required: true,
    min: 0,
  })
  entryPoints!: number;

  @Prop({
    type: [ContestSubject],
    default: [],
  })
  subjects!: ContestSubject[];

  @Prop({
    type: String,
    enum: SolveAndWinContestStatus,
    default: SolveAndWinContestStatus.DRAFT,
    index: true,
  })
  status!: SolveAndWinContestStatus;

  @Prop({
    default: true,
    index: true,
  })
  isActive!: boolean;

  @Prop({
    type: Date,
    required: true,
  })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  windowPeriod!: number;
}

export const SolveAndWinContestSchema =
  SchemaFactory.createForClass(SolveAndWinContest);

SolveAndWinContestSchema.index({
  status: 1,
  isActive: 1,
});

SolveAndWinContestSchema.index({
  startAt: 1,
  endAt: 1,
});
