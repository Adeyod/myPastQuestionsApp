import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';

import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import {
  PracticePointTransaction,
  PracticePointTransactionDocument,
} from '../schemas/practice-point-transaction.schema';

@Injectable()
export class PracticePointTransactionRepository {
  constructor(
    @InjectModel(PracticePointTransaction.name)
    private readonly transactionModel: Model<PracticePointTransactionDocument>,
  ) {}

  async createWithSession(
    data: Partial<PracticePointTransaction>,
    session: ClientSession,
  ): Promise<PracticePointTransactionDocument> {
    const transaction = new this.transactionModel(data);

    return await transaction.save({ session });
  }
  async create(
    data: Partial<PracticePointTransaction>,
  ): Promise<PracticePointTransactionDocument> {
    const transaction = new this.transactionModel(data);

    return await transaction.save();
  }

  async findByWalletId(
    practiceWalletId: Types.ObjectId,
    queryDto: QueryWithPaginationDto,
  ): Promise<{
    totalCount: number;
    totalPages: number;
    practicePointTransactionObj: PracticePointTransactionDocument[];
  }> {
    const { page, limit, searchParams } = queryDto;

    let query = this.transactionModel.find({ practiceWalletId });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [{ description: { $regex: regex } }],
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

    const walletTransactions = await query.sort({ createdAt: -1 });

    if (walletTransactions.length === 0) {
      throw new NotFoundException({
        message: 'Practice point wallet transactions not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      practicePointTransactionObj: walletTransactions,
    };

    return response;
  }

  async findByUserId(
    userId: Types.ObjectId,
  ): Promise<PracticePointTransactionDocument[]> {
    return await this.transactionModel
      .find()
      // .populate({
      //   path: 'practiceWalletId',
      //   match: {
      //     userId,
      //   },
      // })
      // .sort({
      //   createdAt: -1,
      // })
      .exec();
  }

  async findById(
    transactionId: Types.ObjectId,
  ): Promise<PracticePointTransactionDocument | null> {
    return await this.transactionModel.findById(transactionId).exec();
  }

  async findByPracticeId(
    practiceId: Types.ObjectId,
    session: ClientSession,
  ): Promise<PracticePointTransactionDocument | null> {
    return await this.transactionModel
      .findOne({
        practiceId,
      })
      .session(session)
      .exec();
  }
}
