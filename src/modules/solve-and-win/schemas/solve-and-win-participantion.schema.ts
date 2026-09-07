import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  SolveAndWinContentBlock,
  SolveAndWinDifficulty,
  SolveAndWinExamSection,
  SolveAndWinOption,
  SolveAndWinQuestionType,
} from './solve-and-win-question.schema';

export type SolveAndWinParticipationDocument =
  HydratedDocument<SolveAndWinParticipation>;

export enum SolveAndWinParticipationStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISQUALIFIED = 'DISQUALIFIED',
}

// @Schema({ _id: false })
// export class ParticipationQuestion {
//   @Prop({
//     type: Types.ObjectId,
//     ref: 'SolveAndWinQuestion',
//     required: true,
//   })
//   questionId!: Types.ObjectId;

//   @Prop({
//     type: Types.ObjectId,
//     ref: 'Subject',
//     required: true,
//   })
//   subjectId!: Types.ObjectId;

//   @Prop({
//     type: String,
//     default: null,
//   })
//   selectedAnswer?: string | null;

//   @Prop({
//     type: Boolean,
//     default: null,
//   })
//   isCorrect?: boolean | null;

//   @Prop({
//     type: [Types.ObjectId],
//     default: [],
//   })
//   correctAnswers!: Types.ObjectId[];

//   @Prop({
//     default: 0,
//   })
//   marksAwarded!: number;

//   @Prop({
//     default: 1,
//   })
//   maxMarks!: number;
// }

@Schema({ _id: false })
export class ParticipationQuestion {
  @Prop({
    type: Types.ObjectId,
    ref: 'SolveAndWinQuestion',
    required: true,
  })
  questionId!: Types.ObjectId;

  @Prop({
    required: true,
  })
  question!: string;

  @Prop()
  instruction?: string;

  @Prop({
    type: [SolveAndWinContentBlock],
    default: [],
  })
  content!: SolveAndWinContentBlock[];

  @Prop({
    type: SolveAndWinContentBlock,
    default: null,
  })
  media?: SolveAndWinContentBlock;

  @Prop({
    type: [SolveAndWinOption],
    default: [],
  })
  options!: SolveAndWinOption[];

  @Prop({
    type: String,
    enum: SolveAndWinExamSection,
  })
  section!: SolveAndWinExamSection;

  @Prop({
    type: String,
    enum: SolveAndWinQuestionType,
  })
  questionType!: SolveAndWinQuestionType;

  @Prop({
    type: [Types.ObjectId],
    default: [],
  })
  correctAnswers!: Types.ObjectId[];

  @Prop({
    default: false,
  })
  isMultipleAnswer!: boolean;

  @Prop({
    default: '',
  })
  explanation!: string;

  @Prop({
    type: [String],
    default: [],
  })
  explanationSteps!: string[];

  @Prop({
    type: String,
    enum: SolveAndWinDifficulty,
  })
  difficulty!: SolveAndWinDifficulty;

  @Prop({
    default: 1,
  })
  marks!: number;

  // Participant's answer
  @Prop({
    type: Types.ObjectId,
    default: null,
  })
  selectedOption?: Types.ObjectId | null;

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

  @Prop({
    required: true,
  })
  durationInSeconds!: number;

  @Prop({
    required: true,
  })
  remainingDurationInSeconds!: number;

  @Prop({
    type: Date,
    default: null,
  })
  startedAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  endsAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  submittedAt?: Date | null;
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
  endsAt?: Date;

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
