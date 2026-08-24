import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { TransactionCreationDto } from '../dto/transaction-creation.dto';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import {
  Transaction,
  TransactionDocument,
} from '../schemas/transaction.schema';

@Injectable()
export class TransactionsRepository {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async sumReferralEarnings(userId: Types.ObjectId) {
    const response = await this.transactionModel.aggregate([
      {
        $match: {
          userId,
          type: 'REFERRAL_BONUS',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountInKobo' },
        },
      },
    ]);
  }

  async createTransaction(transactionCreationDto: TransactionCreationDto) {
    const {
      walletId,
      amountInKobo,
      description,
      transactionType,
      category,
      referredUserId,
      referralLevel,
      withdrawalId,
    } = transactionCreationDto;
    const id = new Types.ObjectId(walletId);

    const newTransaction = await new this.transactionModel({
      walletId: id,
      amountInKobo,
      type: transactionType,
      description,
      category,
      referredUserId,
      referralLevel,
      withdrawalId: withdrawalId && new Types.ObjectId(withdrawalId),
    }).save();

    return newTransaction;
  }
  async createTransactionWithSession(
    transactionCreationDto: TransactionCreationDto,
    session: ClientSession,
  ) {
    const {
      walletId,
      amountInKobo,
      description,
      transactionType,
      category,
      referredUserId,
      referralLevel,
      withdrawalId,
    } = transactionCreationDto;
    const id = new Types.ObjectId(walletId);

    const newTransaction = await new this.transactionModel({
      walletId: id,
      amountInKobo,
      type: transactionType,
      description,
      category,
      referredUserId,
      referralLevel,
      withdrawalId: withdrawalId && new Types.ObjectId(withdrawalId),
    }).save({ session });

    return newTransaction;
  }

  async getTransactionById(
    transactionId: string,
  ): Promise<TransactionDocument | null> {
    const id = new Types.ObjectId(transactionId);

    const transaction = await this.transactionModel.findById(id);

    return transaction;
  }

  async getAllUserTransactionsByWalletId(
    walletId: Types.ObjectId,
    queryWithPaginationDto: QueryWithPaginationDto,
  ): Promise<{
    transactionObj: TransactionResponseDto[] | null;
    totalPages: number;
    totalCount: number;
  }> {
    const { page, limit, searchParams } = queryWithPaginationDto;

    let query = this.transactionModel.find({ walletId });

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

    const transactions = await query.sort({ createdAt: -1 });

    if (transactions.length === 0) {
      throw new NotFoundException({
        message: 'transactions not found',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      transactionObj: transactions,
    };

    return response;
  }

  async getAllTransactions(
    queryWithPaginationDto: QueryWithPaginationDto,
  ): Promise<{
    transactionObj: TransactionResponseDto[] | null;
    totalPages: number;
    totalCount: number;
  }> {
    console.log('queryWithPaginationDto:', queryWithPaginationDto);
    const { page, limit, searchParams } = queryWithPaginationDto;

    let query = this.transactionModel.find();

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

    const transactions = await query.sort({ createdAt: -1 });

    if (transactions.length === 0) {
      throw new NotFoundException({
        message: 'transactions not found',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      transactionObj: transactions,
    };

    return response;
  }

  // async migratePaymentAmountsToKobo() {
  //   const payments = (await this.transactionModel
  //     .find({
  //       amount: { $exists: true },
  //       amountInKobo: { $exists: false },
  //     })
  //     .lean()) as unknown as LegacyPayment[];

  //   console.log(`Found ${payments.length} payments to migrate.`);

  //   let migratedCount = 0;

  //   for (const payment of payments) {
  //     const amountInKobo = Math.round(payment.amount * 100);

  //     await this.transactionModel.updateOne(
  //       { _id: payment._id },
  //       {
  //         $set: {
  //           amountInKobo,
  //         },
  //         $unset: {
  //           amount: 1,
  //         },
  //       },
  //     );

  //     migratedCount++;
  //   }

  //   return {
  //     message: 'Payment amounts migrated successfully.',
  //     totalFound: payments.length,
  //     migratedCount,
  //   };
  // }
}
