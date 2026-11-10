import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum StudentEnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  TRANSFERRED = 'TRANSFERRED',
  WITHDRAWN = 'WITHDRAWN',
}

export type StudentEnrollmentDocument = HydratedDocument<StudentEnrollment>;

@Schema({ timestamps: true })
export class StudentEnrollment {
  @Prop({
    type: Types.ObjectId,
    ref: 'School',
    required: true,
  })
  schoolId!: Types.ObjectId;

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
    type: String,
    enum: StudentEnrollmentStatus,
    default: StudentEnrollmentStatus.ACTIVE,
    required: true,
  })
  status!: StudentEnrollmentStatus;

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

export const StudentEnrollmentSchema =
  SchemaFactory.createForClass(StudentEnrollment);

StudentEnrollmentSchema.index(
  {
    schoolId: 1,
    schoolMembershipId: 1,
    academicSessionId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: StudentEnrollmentStatus.ACTIVE,
    },
  },
);

// Useful for retrieving students enrolled in a particular class.
StudentEnrollmentSchema.index({
  schoolId: 1,
  classId: 1,
  status: 1,
});

// Useful for retrieving a student's enrolment history.
StudentEnrollmentSchema.index({
  schoolId: 1,
  studentId: 1,
  enrolledAt: -1,
});

StudentEnrollmentSchema.index({
  schoolId: 1,
  academicSessionId: 1,
  status: 1,
});
