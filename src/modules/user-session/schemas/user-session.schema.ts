// user-session.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserSessionDocument = UserSession & Document;

@Schema({ timestamps: true })
export class UserSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  deviceId!: string;

  @Prop()
  deviceName!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: Date.now })
  lastActiveAt!: Date;

  @Prop()
  lastSwitchAt!: Date;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);

// Prevent duplicate device sessions
UserSessionSchema.index({ userId: 1, deviceId: 1 });
// UserSessionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

// TTL (optional - auto delete after 30 days)
UserSessionSchema.index(
  { lastActiveAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 },
);
