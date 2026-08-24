import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PlanCode } from '../../plans/schemas/plan.schema';

export type UserDocument = HydratedDocument<User>;

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ type: String, enum: Role, default: Role.USER })
  role!: Role;

  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: true })
  phoneNumber!: string;

  @Prop({ required: false })
  referralCode!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  referredBy!: Types.ObjectId;

  @Prop({
    type: [
      {
        _id: false,
        userId: { type: Types.ObjectId, ref: 'User', required: true },
        level: { type: Number, required: true },
      },
    ],
    default: [],
  })
  referralChain!: {
    userId: Types.ObjectId;
    level: number;
  }[];

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: false })
  isActive!: boolean;

  @Prop({ default: false })
  hasPaid!: boolean;

  @Prop({})
  lastForcedSwitchAt!: Date;

  @Prop({
    type: [String],
    enum: PlanCode,
    default: [],
  })
  plans!: PlanCode[];

  @Prop({
    type: {
      deviceId: { type: String },
      deviceName: { type: String },
      lastLogin: { type: Date },
    },
    _id: false,
    default: null,
  })
  device!: {
    deviceId: string; // will be generated from frontend if the user does not have one
    deviceName: string; // comes from frontend
    lastLogin: Date;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ 'referralChain.userId': 1 });
