import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum AcademicPeriodType {
  TERM = 'TERM',
  SEMESTER = 'SEMESTER',
}

export enum AcademicSessionStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export type AcademicSessionDocument = HydratedDocument<AcademicSession>;

@Schema({ timestamps: true })
export class AcademicSession {
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
  sessionName!: string;

  @Prop({
    type: String,
    trim: true,
    default: null,
  })
  sectionName!: string | null;

  @Prop({
    type: String,
    enum: AcademicPeriodType,
    required: true,
  })
  periodType!: AcademicPeriodType;

  @Prop({
    type: Date,
    required: true,
  })
  startDate!: Date;

  @Prop({
    type: Date,
    required: true,
  })
  endDate!: Date;

  @Prop({
    type: String,
    enum: AcademicSessionStatus,
    default: AcademicSessionStatus.UPCOMING,
    required: true,
  })
  status!: AcademicSessionStatus;
}

export const AcademicSessionSchema =
  SchemaFactory.createForClass(AcademicSession);

AcademicSessionSchema.index(
  {
    schoolId: 1,
    sessionName: 1,
    sectionName: 1,
  },
  { unique: true },
);

AcademicSessionSchema.index({
  schoolId: 1,
  status: 1,
});

AcademicSessionSchema.index({
  schoolId: 1,
  sectionName: 1,
});
