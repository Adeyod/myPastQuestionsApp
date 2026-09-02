import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TextStyle } from '../../../common/enums/question-type.enum';

export type SolveAndWinQuestionDocument = HydratedDocument<SolveAndWinQuestion>;

export enum SolveAndWinQuestionType {
  MCQ = 'MCQ',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
}

export enum SolveAndWinExamSection {
  OBJECTIVE = 'objective',
  ESSAY = 'essay',
  COMPREHENSION = 'comprehension',
  ORAL = 'oral',
}

export enum SolveAndWinDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum SolveAndWinContentType {
  TEXT = 'text',
  IMAGE = 'image',
  EQUATION = 'equation',
  TABLE = 'table',
  GRAPH = 'graph',
  LIST = 'list',
}

@Schema({ _id: false })
export class SolveAndWinSegment {
  @Prop({
    required: true,
  })
  text!: string;

  @Prop({
    type: [String],
    default: [],
  })
  styles?: TextStyle[];
}

@Schema({ _id: false })
export class SolveAndWinGraphDataset {
  @Prop({
    required: true,
  })
  label!: string;

  @Prop({
    type: [Number],
    required: true,
  })
  data!: number[];
}

@Schema({ _id: false })
export class SolveAndWinGraph {
  @Prop({
    required: true,
  })
  type!: 'line' | 'bar' | 'pie';

  @Prop({
    type: [String],
    required: true,
  })
  labels!: string[];

  @Prop({
    type: [SolveAndWinGraphDataset],
    required: true,
  })
  datasets!: SolveAndWinGraphDataset[];
}

@Schema({ _id: false })
export class SolveAndWinImage {
  @Prop()
  url?: string;

  @Prop()
  publicUrl?: string;
}

@Schema({ _id: false })
export class SolveAndWinContentBlock {
  @Prop({
    required: true,
    enum: Object.values(SolveAndWinContentType),
  })
  type!: SolveAndWinContentType;

  @Prop({
    required: true,
  })
  order!: number;

  /* ---------------- TEXT ---------------- */

  @Prop({
    type: [SolveAndWinSegment],
    default: [],
  })
  segments?: SolveAndWinSegment[];

  /* ---------------- IMAGE ---------------- */

  @Prop({
    type: SolveAndWinImage,
    default: null,
  })
  image?: SolveAndWinImage;

  @Prop()
  alt?: string;

  /* ---------------- EQUATION ---------------- */

  @Prop()
  latex?: string;

  /* ---------------- TABLE ---------------- */

  @Prop({
    type: [[String]],
    default: [],
  })
  table?: string[][];

  /* ---------------- GRAPH ---------------- */

  @Prop({
    type: SolveAndWinGraph,
    default: null,
  })
  graph?: SolveAndWinGraph;

  /* ---------------- LIST ---------------- */

  @Prop({
    type: [String],
    default: [],
  })
  items?: string[];

  /* ---------------- FLEXIBLE METADATA ---------------- */

  @Prop({
    type: Object,
    default: {},
  })
  metadata?: Record<string, any>;
}

@Schema({ _id: true })
export class SolveAndWinOption {
  @Prop({
    required: true,
    trim: true,
  })
  label!: string;

  @Prop({
    required: true,
  })
  value!: string;
}

@Schema({ timestamps: true })
export class SolveAndWinQuestion {
  @Prop({
    type: Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true,
  })
  subjectId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'SolveAndWinPassage',
    default: null,
  })
  passageId?: Types.ObjectId;

  @Prop({
    type: [SolveAndWinContentBlock],
    default: [],
  })
  content!: SolveAndWinContentBlock[];

  @Prop({
    required: true,
    trim: true,
  })
  question!: string;

  @Prop()
  instruction?: string;

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
    default: SolveAndWinExamSection.OBJECTIVE,
  })
  section!: SolveAndWinExamSection;

  @Prop({
    type: String,
    enum: SolveAndWinQuestionType,
    default: SolveAndWinQuestionType.MCQ,
  })
  questionType!: SolveAndWinQuestionType;

  // @Prop({
  //   default: '',
  // })
  // answer!: string;

  /* =======================================================
     CORRECT ANSWERS

     Useful for both single-answer and multiple-answer
     questions.
  ======================================================= */

  @Prop({
    type: [Types.ObjectId],
    default: [],
  })
  correctAnswers!: Types.ObjectId[];

  /* =======================================================
     MULTIPLE ANSWER FLAG
  ======================================================= */

  @Prop({
    default: false,
  })
  isMultipleAnswer!: boolean;

  /* =======================================================
     EXPLANATION
  ======================================================= */

  @Prop({
    default: '',
  })
  explanation!: string;

  /* =======================================================
     EXPLANATION STEPS
  ======================================================= */

  @Prop({
    type: [String],
    default: [],
  })
  explanationSteps!: string[];

  /* =======================================================
     DIFFICULTY
  ======================================================= */

  @Prop({
    type: String,
    enum: SolveAndWinDifficulty,
    default: SolveAndWinDifficulty.EASY,
  })
  difficulty!: SolveAndWinDifficulty;

  /* =======================================================
     MARKS
  ======================================================= */

  @Prop({
    default: 1,
  })
  marks!: number;

  /* =======================================================
     ACTIVE STATUS
  ======================================================= */

  @Prop({
    default: true,
    index: true,
  })
  isActive!: boolean;
}

/* =========================================================
   SCHEMA
========================================================= */

export const SolveAndWinQuestionSchema =
  SchemaFactory.createForClass(SolveAndWinQuestion);

/* =========================================================
   INDEXES
========================================================= */

SolveAndWinQuestionSchema.index({
  subjectId: 1,
  isActive: 1,
});

SolveAndWinQuestionSchema.index({
  passageId: 1,
});
