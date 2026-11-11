import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum ClassStudentEnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  TRANSFERRED = 'TRANSFERRED',
  WITHDRAWN = 'WITHDRAWN',
}

export type ClassEnrollmentDocument = HydratedDocument<ClassEnrollment>;

@Schema({ _id: false })
export class EnrolledStudent {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  studentId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'SchoolMembership',
    required: true,
  })
  schoolMembershipId!: Types.ObjectId;

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'SchoolSubject',
      },
    ],
    default: [],
  })
  subjectsOffered!: Types.ObjectId[];

  @Prop({
    type: String,
    enum: ClassStudentEnrollmentStatus,
    default: ClassStudentEnrollmentStatus.ACTIVE,
    required: true,
  })
  status!: ClassStudentEnrollmentStatus;

  @Prop({
    type: Date,
    default: Date.now,
    required: true,
  })
  enrolledAt!: Date;

  @Prop({
    type: Date,
    default: null,
  })
  endedAt!: Date | null;
}

export const EnrolledStudentSchema =
  SchemaFactory.createForClass(EnrolledStudent);

@Schema({ timestamps: true })
export class ClassEnrollment {
  @Prop({
    type: Types.ObjectId,
    ref: 'School',
    required: true,
  })
  schoolId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'SchoolClass',
    required: true,
  })
  classId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'AcademicSession',
    required: true,
  })
  academicSessionId!: Types.ObjectId;

  @Prop({
    type: [EnrolledStudentSchema],
    default: [],
  })
  students!: EnrolledStudent[];
}

export const ClassEnrollmentSchema =
  SchemaFactory.createForClass(ClassEnrollment);

ClassEnrollmentSchema.index(
  {
    schoolId: 1,
    classId: 1,
    academicSessionId: 1,
  },
  { unique: true },
);

ClassEnrollmentSchema.index({
  schoolId: 1,
  academicSessionId: 1,
  classId: 1,
});
