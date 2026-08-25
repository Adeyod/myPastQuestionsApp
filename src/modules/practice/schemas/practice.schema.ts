import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PracticeStatus } from '../enums/practice-status.enum';

export type PracticeDocument = HydratedDocument<Practice>;

@Schema({ _id: false })
export class PracticeQuestion {
  @Prop({
    type: Types.ObjectId,
    ref: 'Question',
    required: true,
  })
  questionId!: Types.ObjectId;

  @Prop({
    type: String,
    default: null,
  })
  selectedOption?: string | null;

  @Prop({
    type: Boolean,
    default: null,
  })
  isSelectedAnswerCorrect?: boolean | null;

  @Prop({
    default: 0,
  })
  marksAwarded?: number;

  @Prop({
    default: 0,
  })
  pointsAwarded!: number;
}

export const PracticeQuestionSchema =
  SchemaFactory.createForClass(PracticeQuestion);

@Schema({ timestamps: true })
export class Practice {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true,
  })
  subjectId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  examType!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'PracticeMode',
    required: true,
  })
  practiceModeId!: Types.ObjectId;

  /*
   * SNAPSHOT OF THE PRACTICE MODE CONFIGURATION.
   * This prevents old practice records from changing
   * if an admin updates the PracticeMode later.
   */

  @Prop({
    required: true,
  })
  timePerQuestion!: number;

  @Prop({
    required: true,
  })
  awardedPointPerCorrectAnswer!: number;

  @Prop({
    type: String,
    enum: PracticeStatus,
    default: PracticeStatus.IN_PROGRESS,
    index: true,
  })
  status!: PracticeStatus;

  @Prop({
    required: true,
  })
  questionCount!: number;

  @Prop({
    type: [PracticeQuestionSchema],
    required: true,
  })
  questions!: PracticeQuestion[];

  /*
   * PRACTICE RESULT
   */

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

  /*
   * POINTS EARNED FROM THIS PRACTICE
   */

  @Prop({
    default: 0,
  })
  totalPointsAwarded!: number;

  /*
   * TIME TRACKING
   */

  @Prop({
    default: null,
  })
  startedAt?: Date | null;

  @Prop({
    default: null,
  })
  submittedAt?: Date | null;

  @Prop({
    default: 0,
  })
  durationInSeconds!: number;
}

export const PracticeSchema = SchemaFactory.createForClass(Practice);

PracticeSchema.index({
  userId: 1,
  createdAt: -1,
});

PracticeSchema.index({
  userId: 1,
  examType: 1,
});

PracticeSchema.index({
  userId: 1,
  status: 1,
});
