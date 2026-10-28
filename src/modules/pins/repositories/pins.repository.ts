import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';

import { Pin, PinDocument, PinStatus } from '../schemas/pin.schema';

@Injectable()
export class PinsRepository {
  constructor(
    @InjectModel(Pin.name)
    private readonly pinModel: Model<PinDocument>,
  ) {}

  async createMany(
    pins: Partial<Pin>[],
    session: ClientSession,
  ): Promise<PinDocument[]> {
    const response = await this.pinModel.create(pins, {
      session,
      ordered: true,
    });

    return response;
  }

  async findById(
    pinId: string,
    session?: ClientSession,
  ): Promise<PinDocument | null> {
    const response = await this.pinModel
      .findById(pinId)
      .session(session ?? null)
      .exec();

    return response;
  }

  async findByHash(
    pinHash: string,
    session?: ClientSession,
  ): Promise<PinDocument | null> {
    const response = await this.pinModel
      .findOne({ pinHash })
      .session(session ?? null)
      .exec();

    return response;
  }

  async assignPins(
    pinIds: string[],
    vendorId: Types.ObjectId,
    session?: ClientSession,
  ): Promise<number> {
    const result = await this.pinModel.updateMany(
      {
        _id: {
          $in: pinIds.map((id) => new Types.ObjectId(id)),
        },
        status: PinStatus.GENERATED,
        vendorId: null,
      },
      {
        $set: {
          vendorId: vendorId,
          status: PinStatus.ASSIGNED,
          assignedAt: new Date(),
        },
      },
      { session },
    );

    return result.modifiedCount;
  }

  async markAsSold(
    pinId: string,
    vendorId: Types.ObjectId,
    session?: ClientSession,
  ): Promise<PinDocument | null> {
    const response = await this.pinModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(pinId),
          vendorId: vendorId,
          status: PinStatus.ASSIGNED,
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        },
        {
          $set: {
            status: PinStatus.SOLD,
            soldAt: new Date(),
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
          session,
        },
      )
      .exec();

    return response;
  }

  async redeem(
    pinHash: string,
    studentId: Types.ObjectId,
    session: ClientSession,
  ): Promise<PinDocument | null> {
    const response = await this.pinModel
      .findOneAndUpdate(
        {
          pinHash,
          status: PinStatus.GENERATED,
        },
        {
          $set: {
            status: PinStatus.REDEEMED,
            redeemedBy: new Types.ObjectId(studentId),
            redeemedAt: new Date(),
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
          session,
        },
      )
      .exec();
    return response;
  }

  async revoke(
    pinId: string,
    adminId: Types.ObjectId,
  ): Promise<PinDocument | null> {
    const response = await this.pinModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(pinId),
          status: {
            $in: [PinStatus.GENERATED, PinStatus.ASSIGNED, PinStatus.SOLD],
          },
        },
        {
          $set: {
            status: PinStatus.REVOKED,
            revokedBy: adminId,
            revokedAt: new Date(),
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();

    return response;
  }

  async findBatch(batchId: string): Promise<PinDocument[]> {
    const response = await this.pinModel
      .find({
        batchId: new Types.ObjectId(batchId),
      })
      .select('-pinHash')
      .sort({ createdAt: 1 })
      .exec();

    return response;
  }

  async findVendorPins(
    vendorId: Types.ObjectId,
    status?: PinStatus,
  ): Promise<PinDocument[]> {
    const filter: Record<string, unknown> = {
      vendorId: vendorId,
    };

    if (status) {
      filter.status = status;
    }

    const response = await this.pinModel
      .find(filter)
      .select('-pinHash')
      .sort({ createdAt: -1 })
      .exec();

    return response;
  }
}
