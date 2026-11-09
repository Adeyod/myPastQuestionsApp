import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum AcademicPeriodStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export type AcademicPeriodDocument = HydratedDocument<AcademicPeriod>;

@Schema({ timestamps: true })
export class AcademicPeriod {
  @Prop({
    type: Types.ObjectId,
    ref: 'School',
    required: true,
  })
  schoolId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'AcademicSession',
    required: true,
  })
  academicSessionId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  periodName!: string;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  periodNumber!: number;

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
    enum: AcademicPeriodStatus,
    default: AcademicPeriodStatus.UPCOMING,
    required: true,
  })
  status!: AcademicPeriodStatus;
}

export const AcademicPeriodSchema =
  SchemaFactory.createForClass(AcademicPeriod);

AcademicPeriodSchema.index(
  {
    schoolId: 1,
    academicSessionId: 1,
    periodNumber: 1,
  },
  { unique: true },
);

AcademicPeriodSchema.index(
  {
    schoolId: 1,
    academicSessionId: 1,
    periodName: 1,
  },
  { unique: true },
);

AcademicPeriodSchema.index({
  schoolId: 1,
  academicSessionId: 1,
  startDate: 1,
});

AcademicPeriodSchema.index({
  schoolId: 1,
  status: 1,
});
