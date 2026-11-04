import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SchoolDocument = HydratedDocument<School>;

export enum AccessMode {
  SCHOOL_SUBSCRIPTION = 'SCHOOL_SUBSCRIPTION',
  STUDENT_PIN = 'STUDENT_PIN',
}

@Schema({ timestamps: true })
export class School {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  schoolName!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  schoolOwner!: Types.ObjectId | null;

  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  })
  subDomain!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  })
  schoolEmail!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  schoolPhone!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  state!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  town!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  address!: string;

  @Prop({
    type: String,
    enum: AccessMode,
    required: true,
  })
  accessMode!: AccessMode;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive!: boolean;
}

export const SchoolSchema = SchemaFactory.createForClass(School);

SchoolSchema.index({ subDomain: 1 }, { unique: true });
SchoolSchema.index({ schoolEmail: 1 }, { unique: true });
SchoolSchema.index({ schoolOwner: 1 });
SchoolSchema.index({ state: 1, town: 1 });
