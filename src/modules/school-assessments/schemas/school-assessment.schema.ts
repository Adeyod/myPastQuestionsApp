import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SchoolQuestionType } from '../../school-questions/schemas/school-question.schema';

export type SchoolAssessmentDocument = HydratedDocument<SchoolAssessment>;

export enum AssessmentType {
  QUIZ = 'QUIZ',
  TEST = 'TEST',
  EXAM = 'EXAM',
  ASSIGNMENT = 'ASSIGNMENT',
}

export enum AssessmentMarkingMode {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
}

export enum AssessmentStatus {
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

@Schema({ _id: false })
export class AssessmentQuestionOption {
  @Prop({ type: String, required: true, trim: true, uppercase: true })
  key!: string;

  @Prop({ type: String, required: true, trim: true })
  text!: string;

  @Prop({ type: String, default: null })
  imageUrl?: string | null;
}

export const AssessmentQuestionOptionSchema = SchemaFactory.createForClass(
  AssessmentQuestionOption,
);

@Schema({ _id: false })
export class AssessmentAnswerKey {
  @Prop({ type: String, trim: true, uppercase: true })
  correctOptionKey?: string;

  @Prop({ type: [String], default: undefined })
  correctOptionKeys?: string[];

  @Prop({ type: Boolean })
  correctBoolean?: boolean;

  @Prop({ type: [String], default: undefined })
  acceptedAnswers?: string[];

  @Prop({ type: String, trim: true })
  modelAnswer?: string;

  @Prop({ type: String, trim: true })
  markingGuide?: string;
}

export const AssessmentAnswerKeySchema =
  SchemaFactory.createForClass(AssessmentAnswerKey);

@Schema({})
export class AssessmentQuestion {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SchoolQuestion', default: null })
  sourceQuestionId?: Types.ObjectId | null;

  @Prop({ type: Number, required: true, min: 1 })
  order!: number;

  @Prop({
    type: String,
    enum: SchoolQuestionType,
    required: true,
  })
  questionType!: SchoolQuestionType;

  @Prop({ type: String, required: true, trim: true })
  questionText!: string;

  @Prop({ type: [String], default: [] })
  questionImages!: string[];

  @Prop({ type: [AssessmentQuestionOptionSchema], default: [] })
  options!: AssessmentQuestionOption[];

  @Prop({ type: AssessmentAnswerKeySchema, default: null })
  answerKey?: AssessmentAnswerKey | null;

  @Prop({ type: String, default: '' })
  explanation!: string;

  @Prop({ type: Number, required: true, min: 1 })
  marks!: number;
}

export const AssessmentQuestionSchema =
  SchemaFactory.createForClass(AssessmentQuestion);

@Schema({ timestamps: true })
export class SchoolAssessment {
  @Prop({ type: Types.ObjectId, ref: 'School', required: true })
  schoolId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SchoolSubject', required: true })
  subjectId!: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'SchoolClass' }],
    required: true,
  })
  classIds!: Types.ObjectId[];

  @Prop({
    type: Types.ObjectId,
    ref: 'SchoolMembership',
    required: true,
  })
  teacherMembershipId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'AcademicSession',
    required: true,
  })
  academicSessionId!: Types.ObjectId;

  // @Prop({
  //   type: Types.ObjectId,
  //   ref: 'AcademicPeriod',
  //   default: null,
  // })
  // academicPeriodId?: Types.ObjectId | null;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, default: '', trim: true })
  description!: string;

  @Prop({ type: String, default: '', trim: true })
  instructions!: string;

  @Prop({
    type: String,
    enum: AssessmentType,
    required: true,
  })
  assessmentType!: AssessmentType;

  @Prop({
    type: String,
    enum: AssessmentMarkingMode,
    required: true,
  })
  markingMode!: AssessmentMarkingMode;

  @Prop({ type: Number, required: true, min: 1 })
  durationMinutes!: number;

  @Prop({ type: Number, required: true, min: 1 })
  totalMarks!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  passMark!: number;

  @Prop({ type: Date, required: true })
  startsAt!: Date;

  @Prop({ type: Date, required: true })
  endsAt!: Date;

  @Prop({ type: Number, default: 1, min: 1 })
  attemptsAllowed!: number;

  @Prop({
    type: [AssessmentQuestionSchema],
    default: [],
  })
  questions!: AssessmentQuestion[];

  @Prop({
    type: String,
    enum: AssessmentStatus,
    default: AssessmentStatus.PUBLISHED,
  })
  status!: AssessmentStatus;

  @Prop({ type: Date, default: Date.now })
  publishedAt!: Date;

  @Prop({ type: Date, default: null })
  closedAt?: Date | null;
}

export const SchoolAssessmentSchema =
  SchemaFactory.createForClass(SchoolAssessment);

SchoolAssessmentSchema.index({
  schoolId: 1,
  subjectId: 1,
  classIds: 1,
  status: 1,
  startsAt: 1,
  endsAt: 1,
});

SchoolAssessmentSchema.index({
  schoolId: 1,
  teacherMembershipId: 1,
  createdAt: -1,
});

SchoolAssessmentSchema.index({
  schoolId: 1,
  academicSessionId: 1,
  subjectId: 1,
});
