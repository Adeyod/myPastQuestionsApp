import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
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

  async getAllPracticeWallets(queryDto: QueryWithPaginationDto): Promise<{
    totalCount: number;
    totalPages: number;
    practiceWalletObj: PracticeWalletDocument[];
  }> {
    const { page, limit, searchParams } = queryDto;
    let query = this.practiceWalletModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [{ points: { $regex: regex } }],
      });
    }

    const count = await query.clone().countDocuments();
    let pages = 0;

    if (page !== undefined && limit !== undefined && count !== 0) {
      const offset = (page - 1) * limit;

      query = query.skip(offset).limit(limit);
      pages = Math.ceil(count / limit);

      if (page > pages) {
        throw new NotFoundException({
          message: 'Page not found.',
          success: false,
          status: 404,
        });
      }
    }

    const wallets = await query.sort({ createdAt: -1 });

    if (wallets.length === 0) {
      throw new NotFoundException({
        message: 'Practice wallets not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      practiceWalletObj: wallets,
    };

    return response;
  }
}
