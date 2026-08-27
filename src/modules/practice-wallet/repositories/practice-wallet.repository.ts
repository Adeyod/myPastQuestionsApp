import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  PracticeWallet,
  PracticeWalletDocument,
} from '../schemas/practice-wallet.schema';

@Injectable()
export class PracticeWalletRepository {
  constructor(
    @InjectModel(PracticeWallet.name)
    private readonly practiceWalletModel: Model<PracticeWalletDocument>,
  ) {}

  async createPracticeWallet(
    userId: Types.ObjectId,
  ): Promise<PracticeWalletDocument> {
    const wallet = new this.practiceWalletModel({
      userId,
      points: 0,
    });

    return await wallet.save();
  }

  // async findOrCreateByUserId(
  //   userId: Types.ObjectId,
  // ): Promise<PracticeWalletDocument> {
  //   const existingWallet = await this.practiceWalletModel
  //     .findOne({ userId })
  //     .exec();

  //   if (existingWallet) {
  //     return existingWallet;
  //   }

  //   return await this.createPracticeWallet(userId);
  // }

  async findOrCreateByUserId(
    userId: Types.ObjectId,
  ): Promise<PracticeWalletDocument> {
    const wallet = await this.practiceWalletModel
      .findOneAndUpdate(
        { userId },
        {
          $setOnInsert: {
            userId,
            points: 0,
          },
        },
        {
          returnDocument: 'after',
          upsert: true,
          runValidators: true,
        },
      )
      .exec();

    return wallet;
  }
  async findOrCreateByUserIdWithSession(
    userId: Types.ObjectId,
    session: ClientSession,
  ): Promise<PracticeWalletDocument> {
    const wallet = await this.practiceWalletModel
      .findOneAndUpdate(
        { userId },
        {
          $setOnInsert: {
            userId,
            points: 0,
          },
        },
        {
          returnDocument: 'after',
          upsert: true,
          runValidators: true,
          session,
        },
      )
      .exec();

    return wallet;
  }

  async findByUserId(
    userId: Types.ObjectId,
  ): Promise<PracticeWalletDocument | null> {
    return await this.practiceWalletModel.findOne({ userId }).exec();
  }

  async findById(
    walletId: Types.ObjectId,
  ): Promise<PracticeWalletDocument | null> {
    return await this.practiceWalletModel.findById(walletId).exec();
  }
  async incrementPoints(
    walletId: Types.ObjectId,
    points: number,
    session: ClientSession,
  ): Promise<PracticeWalletDocument | null> {
    return await this.practiceWalletModel
      .findByIdAndUpdate(
        walletId,
        {
          $inc: {
            points,
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
          session,
        },
      )
      .exec();
  }

  async decrementPoints(
    walletId: Types.ObjectId,
    points: number,
  ): Promise<PracticeWalletDocument | null> {
    return await this.practiceWalletModel
      .findOneAndUpdate(
        {
          _id: walletId,
          points: { $gte: points },
        },
        {
          $inc: {
            points: -points,
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();
  }

  async updatePoints(
    walletId: Types.ObjectId,
    points: number,
  ): Promise<PracticeWalletDocument | null> {
    return await this.practiceWalletModel
      .findByIdAndUpdate(
        walletId,
        {
          $set: {
            points,
          },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();
  }
}
