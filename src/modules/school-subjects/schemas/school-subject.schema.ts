import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SchoolSubjectDocument = HydratedDocument<SchoolSubject>;

@Schema({ timestamps: true })
export class SchoolSubject {
  @Prop({
    type: Types.ObjectId,
    ref: 'School',
    required: true,
  })
  schoolId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  subjectName!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  })
  subjectCode!: string;

  @Prop({
    type: String,
    default: '',
    trim: true,
  })
  description!: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive!: boolean;
}

export const SchoolSubjectSchema = SchemaFactory.createForClass(SchoolSubject);

SchoolSubjectSchema.index({ schoolId: 1, subjectCode: 1 }, { unique: true });

SchoolSubjectSchema.index({ schoolId: 1, isActive: 1 });
