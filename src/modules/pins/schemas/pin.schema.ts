import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PinDocument = HydratedDocument<Pin>;

export enum PinStatus {
  GENERATED = 'GENERATED',
  ASSIGNED = 'ASSIGNED',
  SOLD = 'SOLD',
  REDEEMED = 'REDEEMED',
  REVOKED = 'REVOKED',
}

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'subscription_pins',
})
export class Pin {
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  pinHash!: string;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Plan',
    index: true,
  })
  planId!: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    index: true,
  })
  batchId!: Types.ObjectId;

  @Prop({
    required: false,
    type: Types.ObjectId,
    default: null,
    index: true,
  })
  vendorId!: Types.ObjectId | null;

  @Prop({
    required: true,
    enum: PinStatus,
    default: PinStatus.GENERATED,
    index: true,
  })
  status!: PinStatus;

  @Prop({
    required: true,
    min: 0,
  })
  amount!: number;

  // @Prop({
  //   required: false,
  //   default: null,
  //   type: Date,
  // })
  // expiresAt!: Date | null;

  @Prop({
    required: false,
    type: Types.ObjectId,
    default: null,
  })
  generatedBy!: Types.ObjectId | null;

  @Prop({
    required: false,
    default: null,
    type: Date,
  })
  assignedAt!: Date | null;

  @Prop({
    required: false,
    default: null,
    type: Date,
  })
  soldAt!: Date | null;

  @Prop({
    required: false,
    type: Types.ObjectId,
    default: null,
  })
  redeemedBy!: Types.ObjectId | null;

  @Prop({
    required: false,
    default: null,
    type: Date,
  })
  redeemedAt!: Date | null;

  @Prop({
    required: false,
    type: Types.ObjectId,
    default: null,
  })
  revokedBy!: Types.ObjectId | null;

  @Prop({
    required: false,
    type: Date,
    default: null,
  })
  revokedAt!: Date | null;
}

export const PinSchema = SchemaFactory.createForClass(Pin);

PinSchema.index({ batchId: 1, status: 1 });
PinSchema.index({ vendorId: 1, status: 1 });
PinSchema.index({ redeemedBy: 1, redeemedAt: -1 });
