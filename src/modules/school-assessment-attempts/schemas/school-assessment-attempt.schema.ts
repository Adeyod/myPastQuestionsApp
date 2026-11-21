import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { AssessmentMarkingMode } from '../../school-assessments/schemas/school-assessment.schema';
import { SchoolQuestionType } from '../../school-questions/schemas/school-question.schema';

export type SchoolAssessmentAttemptDocument =
  HydratedDocument<SchoolAssessmentAttempt>;

export enum AssessmentAttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  AWAITING_MARKING = 'AWAITING_MARKING',
  MARKED = 'MARKED',
  EXPIRED = 'EXPIRED',
}

export enum AssessmentAnswerMarkingStatus {
  PENDING = 'PENDING',
  MARKED = 'MARKED',
}

export enum AssessmentAttemptFinalizationReason {
  STUDENT_SUBMISSION = 'STUDENT_SUBMISSION',
  TIME_EXPIRED = 'TIME_EXPIRED',
}

@Schema({ _id: false })
export class AssessmentAttemptOption {
  @Prop({ required: true })
  key!: string;

  @Prop({ required: true })
  text!: string;

  @Prop()
  imageUrl?: string;
}

export const AssessmentAttemptOptionSchema = SchemaFactory.createForClass(
  AssessmentAttemptOption,
);

@Schema({ _id: false })
export class AssessmentAttemptQuestion {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  questionId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: SchoolQuestionType,
    required: true,
  })
  questionType!: SchoolQuestionType;

  @Prop({ required: true })
  questionText!: string;

  @Prop({ type: [String], default: [] })
  questionImages!: string[];

  @Prop({ type: [AssessmentAttemptOptionSchema], default: [] })
  options!: AssessmentAttemptOption[];

  @Prop({ required: true, min: 0 })
  marks!: number;

  @Prop({ type: SchemaTypes.Mixed })
  answerKey?: Record<string, any>;

  @Prop()
  explanation?: string;
}

export const AssessmentAttemptQuestionSchema = SchemaFactory.createForClass(
  AssessmentAttemptQuestion,
);

@Schema({ _id: false })
export class AssessmentAttemptAnswer {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  questionId!: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  selectedOptionKeys!: string[];

  @Prop()
  textAnswer?: string;

  @Prop({ required: true })
  answeredAt!: Date;

  @Prop({ type: Boolean, default: null })
  isCorrect!: boolean | null;

  @Prop({ type: Number, default: 0, min: 0 })
  marksAwarded!: number;

  @Prop({
    type: String,
    enum: AssessmentAnswerMarkingStatus,
    default: AssessmentAnswerMarkingStatus.PENDING,
  })
  markingStatus!: AssessmentAnswerMarkingStatus;
}

export const AssessmentAttemptAnswerSchema = SchemaFactory.createForClass(
  AssessmentAttemptAnswer,
);

@Schema({ timestamps: true })
export class SchoolAssessmentAttempt {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'School',
    required: true,
  })
  schoolId!: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'SchoolAssessment',
    required: true,
  })
  assessmentId!: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
  })
  studentId!: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'SchoolMembership',
    required: true,
  })
  studentMembershipId!: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'AcademicSession',
    required: true,
  })
  academicSessionId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: AssessmentAttemptStatus,
    default: AssessmentAttemptStatus.IN_PROGRESS,
  })
  status!: AssessmentAttemptStatus;

  @Prop({
    type: String,
    enum: AssessmentMarkingMode,
    required: true,
  })
  markingMode!: AssessmentMarkingMode;

  @Prop({ type: [AssessmentAttemptQuestionSchema], default: [] })
  questions!: AssessmentAttemptQuestion[];

  @Prop({ type: [AssessmentAttemptAnswerSchema], default: [] })
  answers!: AssessmentAttemptAnswer[];

  @Prop({ required: true })
  startedAt!: Date;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop()
  submittedAt?: Date;

  @Prop({ type: Number, default: 0 })
  totalMarks!: number;

  @Prop({ type: Number, default: 0 })
  marksAwarded!: number;

  @Prop({ type: Number, default: null })
  score?: number | null;

  @Prop({
    type: String,
    enum: AssessmentAttemptFinalizationReason,
    default: null,
  })
  finalizationReason?: AssessmentAttemptFinalizationReason | null;

  @Prop()
  markedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const SchoolAssessmentAttemptSchema = SchemaFactory.createForClass(
  SchoolAssessmentAttempt,
);

SchoolAssessmentAttemptSchema.index(
  {
    schoolId: 1,
    assessmentId: 1,
    studentMembershipId: 1,
  },
  { unique: true },
);

SchoolAssessmentAttemptSchema.index({
  schoolId: 1,
  studentMembershipId: 1,
  status: 1,
});
