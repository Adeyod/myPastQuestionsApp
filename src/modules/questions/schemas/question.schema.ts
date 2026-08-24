import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  QuestionType,
  TextStyle,
} from '../../../common/enums/question-type.enum';
import { PlanCode } from '../../plans/schemas/plan.schema';

export type QuestionDocument = Question & Document;

export enum ExamDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum ExamSection {
  objective = 'objective',
  essay = 'essay',
  comprehension = 'comprehension',
  oral = 'oral',
}

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  EQUATION = 'equation',
  TABLE = 'table',
  GRAPH = 'graph',
  LIST = 'list',
}

@Schema({ _id: false })
export class Segment {
  @Prop({ required: true })
  text!: string;

  @Prop({
    type: [String],
    enum: TextStyle, // IMPORTANT: enforce enum
    default: [],
  })
  styles?: TextStyle[];
}

@Schema({ _id: false })
class GraphDataset {
  @Prop({ required: true })
  label!: string;

  @Prop({ type: [Number], required: true })
  data!: number[];
}

@Schema({ _id: false })
class Graph {
  @Prop({ required: true })
  type!: 'line' | 'bar' | 'pie';

  @Prop({ type: [String], required: true })
  labels!: string[];

  @Prop({ type: [GraphDataset], required: true })
  datasets!: GraphDataset[];
}

@Schema({ _id: false })
class Image {
  @Prop()
  url?: string;

  @Prop()
  publicUrl?: string;
}

@Schema({ _id: false })
export class ContentBlock {
  @Prop({
    required: true,
    enum: ['text', 'image', 'equation', 'table', 'graph', 'list'],
  })
  type!: 'text' | 'image' | 'equation' | 'table' | 'graph' | 'list';

  @Prop({ required: true })
  order!: number;

  /* -------- TEXT (PRIMARY APPROACH) -------- */

  @Prop({
    type: [Segment],
    default: [],
  })
  segments?: Segment[];

  /* -------- IMAGE -------- */

  @Prop({ type: Image, default: null })
  image?: Image;

  @Prop()
  alt?: string;

  /* -------- EQUATION -------- */

  @Prop()
  latex?: string;

  /* -------- TABLE -------- */

  @Prop({
    type: [[String]],
    default: [],
  })
  table?: string[][];

  /* -------- GRAPH -------- */

  @Prop({
    type: Graph,
  })
  graph?: Graph;

  /* -------- LIST -------- */

  @Prop({
    type: [String],
    default: [],
  })
  items?: string[];

  /* -------- FLEXIBLE METADATA -------- */

  @Prop({
    type: Object,
    default: {},
  })
  metadata?: Record<string, any>;
}

@Schema({ _id: false })
export class Option {
  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  value!: string;
}

@Schema({ timestamps: true })
export class Passage {
  @Prop({ type: [ContentBlock], required: true })
  content!: ContentBlock[];

  @Prop()
  title?: string;

  @Prop({ required: true, ref: 'Subject' })
  subject!: Types.ObjectId;
}

@Schema({ timestamps: true })
export class Question {
  // Replace plain string with structured content
  @Prop({ type: [ContentBlock], required: true })
  content!: ContentBlock[];

  @Prop({ required: true, trim: true })
  question!: string;

  @Prop()
  imageId?: string;

  // Link to passage instead of storing text
  @Prop({ type: Types.ObjectId, ref: 'Passage', default: null })
  passageId?: Types.ObjectId;

  // Flexible media (image, diagram, audio later)
  @Prop({ type: ContentBlock, default: null })
  media?: ContentBlock;

  // Proper options array
  @Prop({ type: [Option], default: [] })
  options?: Option[];

  @Prop({ required: true })
  apiQuestionId!: string;

  @Prop()
  instruction!: string;

  @Prop()
  topic!: string;

  @Prop({ type: String, enum: ExamSection, default: 'objective' })
  section?: ExamSection;

  @Prop({ default: '' })
  answer!: string;

  @Prop({ default: '' })
  solution!: string;

  @Prop({ default: '' })
  explanation!: string;

  @Prop({
    type: [String],
    default: [],
  })
  explanationSteps!: string[];

  @Prop({ default: '' })
  examType!: string;

  @Prop({ default: '' })
  examYear!: string;

  @Prop({ required: true })
  apiSubjectName!: string;

  @Prop({ type: String, enum: ExamDifficulty, default: ExamDifficulty.EASY })
  difficulty!: ExamDifficulty;

  @Prop()
  category!: string;

  @Prop({ required: false })
  plan!: PlanCode;

  @Prop({ required: true, ref: 'Subject' })
  subject!: Types.ObjectId;

  @Prop({
    type: String,
    enum: QuestionType,
    required: true,
    default: QuestionType.MCQ,
  })
  questionType!: QuestionType;

  @Prop({ type: [String], default: [] })
  correctAnswers!: string[];

  @Prop({ default: false })
  isMultipleAnswer?: boolean;

  @Prop({ default: 1 })
  marks?: number;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
QuestionSchema.index({ subject: 1, examType: 1 });
