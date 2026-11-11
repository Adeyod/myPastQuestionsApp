import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TeachingAssignmentDocument = HydratedDocument<TeachingAssignment>;

@Schema({ timestamps: true })
export class TeachingAssignment {
  @Prop({
    type: Types.ObjectId,
    ref: 'School',
    required: true,
  })
  schoolId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'SchoolMembership',
    required: true,
  })
  teacherMembershipId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'SchoolClass',
    required: true,
  })
  classId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'SchoolSubject',
    required: true,
  })
  subjectId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'AcademicSession',
    required: true,
  })
  academicSessionId!: Types.ObjectId;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive!: boolean;
}

export const TeachingAssignmentSchema =
  SchemaFactory.createForClass(TeachingAssignment);

TeachingAssignmentSchema.index({
  schoolId: 1,
  teacherMembershipId: 1,
  academicSessionId: 1,
  isActive: 1,
});

TeachingAssignmentSchema.index({
  schoolId: 1,
  classId: 1,
  subjectId: 1,
  academicSessionId: 1,
  isActive: 1,
});
