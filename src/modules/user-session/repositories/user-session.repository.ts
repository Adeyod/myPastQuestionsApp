import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserSession,
  UserSessionDocument,
} from '../schemas/user-session.schema';

@Injectable()
export class UserSessionRepository {
  constructor(
    @InjectModel(UserSession.name)
    private sessionModel: Model<UserSessionDocument>,
  ) {}

  async findActiveSession(userId: Types.ObjectId) {
    const response = await this.sessionModel.find({
      userId,
      isActive: true,
    });

    console.log('findActiveSession response:', response);

    return response;
  }

  async findByUserAndDevice(
    userId: Types.ObjectId,
    deviceId: string,
  ): Promise<UserSessionDocument | null> {
    const response = await this.sessionModel.findOne({ userId, deviceId });
    // .exec();

    console.log('findByUserAndDevice response:', response);

    return response;
  }

  async findActiveSessionsExcludingDevice(
    userId: Types.ObjectId,
    deviceId: string,
  ) {
    const response = await this.sessionModel
      .find({
        userId,
        deviceId: { $ne: deviceId },
        isActive: true,
      })
      .exec();
    return response;
  }

  async createSession(
    data: Partial<UserSession>,
  ): Promise<UserSessionDocument> {
    const response = await new this.sessionModel(data).save();

    console.log('createSession response:', response);

    return response;
  }

  async updateSession(sessionId: string, data: Partial<UserSession>) {
    const id = new Types.ObjectId(sessionId);

    const response = await this.sessionModel.findByIdAndUpdate(id, data, {
      new: true,
    });

    console.log('updateSession response:', response);
    if (!response) {
      throw new NotFoundException({
        message: 'User session not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async deactivateSessions(userId: Types.ObjectId) {
    const response = await this.sessionModel.updateMany(
      { userId, isActive: true },
      { isActive: false },
    );

    console.log('deactivateSessions response:', response);

    return response;
  }

  async deactivateOtherSessions(userId: string, deviceId: string) {
    const response = await this.sessionModel.updateMany(
      { userId, deviceId: { $ne: deviceId }, isActive: true },
      { isActive: false },
    );

    console.log('deactivateOtherSessions response:', response);

    return response;
  }
}
