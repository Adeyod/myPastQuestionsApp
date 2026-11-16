import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SchoolQuestionDocument = HydratedDocument<SchoolQuestion>;

export enum SchoolQuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
}

export enum SchoolQuestionDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum SchoolQuestionSource {
  DIRECT = 'DIRECT',
  ASSESSMENT = 'ASSESSMENT',
}

@Schema({ _id: false })
export class SchoolQuestionOption {
  @Prop({
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  })
  key!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  text!: string;

  @Prop({
    type: String,
    default: null,
  })
  imageUrl?: string | null;
}

export const SchoolQuestionOptionSchema =
  SchemaFactory.createForClass(SchoolQuestionOption);

@Schema({ _id: false })
export class SchoolQuestionAnswerKey {
  @Prop({
    type: String,
    trim: true,
    uppercase: true,
  })
  correctOptionKey?: string;

  @Prop({
    type: [String],
    default: undefined,
  })
  correctOptionKeys?: string[];

  @Prop({
    type: Boolean,
  })
  correctBoolean?: boolean;

  @Prop({
    type: [String],
    default: undefined,
  })
  acceptedAnswers?: string[];

  @Prop({
    type: String,
    trim: true,
  })
  modelAnswer?: string;

  @Prop({
    type: String,
    trim: true,
  })
  markingGuide?: string;
}

export const SchoolQuestionAnswerKeySchema = SchemaFactory.createForClass(
  SchoolQuestionAnswerKey,
);

@Schema({ timestamps: true })
export class SchoolQuestion {
  @Prop({
    type: Types.ObjectId,
    ref: 'School',
    required: true,
  })
  schoolId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'SchoolSubject',
    required: true,
  })
  subjectId!: Types.ObjectId;

  @Prop({
    type: [Types.ObjectId],
    ref: 'SchoolClass',
    required: true,
  })
  classIds!: Types.ObjectId[];

  @Prop({
    type: Types.ObjectId,
    ref: 'SchoolMembership',
    required: true,
  })
  createdByMembershipId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: SchoolQuestionSource,
    required: true,
    default: SchoolQuestionSource.DIRECT,
  })
  source!: SchoolQuestionSource;

  @Prop({ type: Types.ObjectId, ref: 'SchoolAssessment', default: null })
  sourceAssessmentId?: Types.ObjectId | null;

  @Prop({ type: Date, required: true, default: Date.now })
  practiceAvailableAt!: Date;

  @Prop({
    type: String,
    enum: SchoolQuestionType,
    required: true,
  })
  questionType!: SchoolQuestionType;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  questionText!: string;

  @Prop({
    type: [String],
    default: [],
  })
  questionImages!: string[];

  @Prop({
    type: [SchoolQuestionOptionSchema],
    default: [],
  })
  options!: SchoolQuestionOption[];

  @Prop({
    type: SchoolQuestionAnswerKeySchema,
    default: null,
  })
  answerKey?: SchoolQuestionAnswerKey | null;

  @Prop({
    type: String,
    enum: SchoolQuestionDifficulty,
    default: SchoolQuestionDifficulty.MEDIUM,
  })
  difficulty!: SchoolQuestionDifficulty;

  @Prop({
    type: String,
    trim: true,
    default: null,
  })
  topic?: string | null;

  @Prop({
    type: String,
    trim: true,
    default: null,
  })
  explanation?: string | null;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive!: boolean;
}

export const SchoolQuestionSchema =
  SchemaFactory.createForClass(SchoolQuestion);

SchoolQuestionSchema.index({
  schoolId: 1,
  subjectId: 1,
  classIds: 1,
  isActive: 1,
  practiceAvailableAt: 1,
});

SchoolQuestionSchema.index({
  schoolId: 1,
  sourceAssessmentId: 1,
});

SchoolQuestionSchema.index({
  schoolId: 1,
  createdByMembershipId: 1,
  createdAt: -1,
});
