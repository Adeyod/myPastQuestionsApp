import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SchoolClassDocument = HydratedDocument<SchoolClass>;

@Schema({ timestamps: true })
export class SchoolClass {
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
  className!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  })
  classCode!: string;

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

export const SchoolClassSchema = SchemaFactory.createForClass(SchoolClass);

SchoolClassSchema.index({ schoolId: 1, classCode: 1 }, { unique: true });

SchoolClassSchema.index({ schoolId: 1, isActive: 1 });
