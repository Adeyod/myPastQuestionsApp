import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TeacherSubjectAssigmentDocument =
  HydratedDocument<TeacherSubjectAssignment>;

@Schema({ _id: false })
export class TeacherSubjectAssignment {
  @Prop({ type: Types.ObjectId, ref: 'SchoolMembership', required: true })
  teacher!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SchoolSubject', required: true })
  subject!: Types.ObjectId;
}

export const TeacherSubjectAssignmentSchema = SchemaFactory.createForClass(
  TeacherSubjectAssignment,
);
