import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ClassSubjectAssigmentDocument =
  HydratedDocument<ClassSubjectAssignment>;

@Schema({ _id: false })
export class ClassSubjectAssignment {
  @Prop({ type: Types.ObjectId, ref: 'SchoolClass', required: true })
  class!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SchoolSubject', required: true })
  subject!: Types.ObjectId;
}

export const ClassSubjectAssignmentSchema = SchemaFactory.createForClass(
  ClassSubjectAssignment,
);
