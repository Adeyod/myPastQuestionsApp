import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  ClassSubjectAssignment,
  ClassSubjectAssignmentSchema,
} from '../../teaching-assignments/schemas/class-subject-assignment.schema';

export type SchoolMembershipDocument = HydratedDocument<SchoolMembership>;

export enum SchoolRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

@Schema({ timestamps: true })
export class SchoolMembership {
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
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: SchoolRole,
    required: true,
  })
  role!: SchoolRole;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive!: boolean;

  @Prop({
    type: [ClassSubjectAssignmentSchema],
    default: [],
  })
  teachingAssignment!: ClassSubjectAssignment[];

  @Prop({
    type: Date,
    default: Date.now,
  })
  joinedAt!: Date;
}

export const SchoolMembershipSchema =
  SchemaFactory.createForClass(SchoolMembership);

SchoolMembershipSchema.index({ schoolId: 1, userId: 1 }, { unique: true });

SchoolMembershipSchema.index({
  schoolId: 1,
  role: 1,
  isActive: 1,
});

SchoolMembershipSchema.index({
  userId: 1,
  isActive: 1,
});
