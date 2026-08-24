import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { TransactionsRepository } from '../../../modules/transactions/repositories/transaction.repository';
import {
  TransactionCategoryEnum,
  TransactionType,
} from '../../../modules/transactions/schemas/transaction.schema';
import { WalletCreditDto } from '../dto/wallet-credit.dto';
import { WalletDebitDto } from '../dto/wallet-debit.dto';
import { WalletDocument } from '../schemas/wallet.schema';

@Injectable()
export class WalletsRepository {
  constructor(
    @InjectModel('Wallet') private walletModel: Model<WalletDocument>,
    private transactionsRepository: TransactionsRepository,
  ) {}

  async createWallet(userId: string): Promise<WalletDocument> {
    const user = new Types.ObjectId(userId);
    const newWallet = await new this.walletModel({
      userId: user,
      balance: 0,
    }).save();

    return newWallet;
  }

  async findWalletByUserId(userId: string): Promise<WalletDocument | null> {
    const user = new Types.ObjectId(userId);

    const wallet = await this.walletModel.findOne({ userId: user });

    return wallet;
  }
  async findWalletById(walletId: string): Promise<WalletDocument | null> {
    const id = new Types.ObjectId(walletId);

    const wallet = await this.walletModel.findById(id);

    return wallet;
  }
  async findWalletByIdWithSession(
    walletId: string,
    session: ClientSession,
  ): Promise<WalletDocument | null> {
    const id = new Types.ObjectId(walletId);

    const wallet = await this.walletModel.findById(id).session(session);

    return wallet;
  }

  async creditUserWallet(
    userId: Types.ObjectId,
    amount: number,
    session: ClientSession,
  ) {
    const response = await this.walletModel
      .findOneAndUpdate(
        {
          userId,
        },
        { $inc: { balance: amount } },
        { returnDocument: 'after' },
      )
      .session(session);

    return response;
  }

  async creditWallet(
    walletCreditDto: WalletCreditDto,
  ): Promise<WalletDocument | null> {
    const {
      walletId,
      amountInKobo,
      description,
      category,
      referredUserId,
      referralLevel,
    } = walletCreditDto;
    const id = new Types.ObjectId(walletId);

    const walletBal = await this.walletModel.findByIdAndUpdate(
      id,
      {
        $inc: { balance: amountInKobo },
      },
      {
        returnDocument: 'after',
      },
    );

    const payload = {
      walletId,
      amountInKobo,
      description,
      transactionType: TransactionType.CREDIT,
      category,
      referredUserId,
      referralLevel,
    };

    const transactionCreation =
      await this.transactionsRepository.createTransaction(payload);
    return walletBal;
  }
  async creditWalletWithSession(
    walletCreditDto: WalletCreditDto,
    session: ClientSession,
  ): Promise<WalletDocument | null> {
    const {
      walletId,
      amountInKobo,
      description,
      category,
      referredUserId,
      referralLevel,
    } = walletCreditDto;
    const id = new Types.ObjectId(walletId);

    const walletBal = await this.walletModel
      .findByIdAndUpdate(
        id,
        {
          $inc: { balanceInKobo: amountInKobo },
        },
        {
          returnDocument: 'after',
        },
      )
      .session(session);

    const payload = {
      walletId,
      amountInKobo,
      description,
      transactionType: TransactionType.CREDIT,
      category,
      referredUserId,
      referralLevel,
    };

    const transactionCreation =
      await this.transactionsRepository.createTransactionWithSession(
        payload,
        session,
      );

    console.log('walletBal:', walletBal);
    console.log('transactionCreation:', transactionCreation);
    return walletBal;
  }

  async debitWallet(walletDebitDto: WalletDebitDto) {
    const { walletId, amountInKobo, description } = walletDebitDto;

    const id = new Types.ObjectId(walletId);

    const wallet = await this.walletModel.findById(id);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found',
        success: false,
        status: 404,
      });
    }

    if (wallet.balanceInKobo < amountInKobo) {
      throw new BadRequestException({
        message: 'Insufficient balance',
        success: false,
        status: 400,
      });
    }

    await this.walletModel.findByIdAndUpdate(wallet._id, {
      $inc: { balanceInKobo: -amountInKobo },
    });

    const payload = {
      walletId,
      amountInKobo,
      description,
      transactionType: TransactionType.DEBIT,
      category: TransactionCategoryEnum.GENERAL,
    };
    const debitTransaction =
      await this.transactionsRepository.createTransaction(payload);

    // We need to add the process of calling payment provider to credit the account number of the user here
  }
  async chargeWallet(walletDebitDto: WalletDebitDto) {
    const { walletId, amountInKobo, description } = walletDebitDto;

    const id = new Types.ObjectId(walletId);

    const wallet = await this.walletModel.findById(id);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found',
        success: false,
        status: 404,
      });
    }

    if (wallet.balanceInKobo < amountInKobo) {
      throw new BadRequestException({
        message: 'Insufficient balance',
        success: false,
        status: 400,
      });
    }

    await this.walletModel.findByIdAndUpdate(wallet._id, {
      $inc: { balanceInKobo: -amountInKobo },
    });

    const payload = {
      walletId,
      amountInKobo,
      description,
      transactionType: TransactionType.DEBIT,
      category: TransactionCategoryEnum.GENERAL,
    };
    const debitTransaction =
      await this.transactionsRepository.createTransaction(payload);

    return debitTransaction;
  }

  async findWalletsByUserIds(
    userIds: string[] | Types.ObjectId[],
  ): Promise<WalletDocument[]> {
    if (!userIds?.length) return [];

    const objectIds = userIds.map((id) =>
      typeof id === 'string' ? new Types.ObjectId(id) : id,
    );

    return await this.walletModel.find({
      userId: { $in: objectIds },
    });
  }
  async findWalletsByUserIdsWithSession(
    userIds: string[] | Types.ObjectId[],
    session: ClientSession,
  ): Promise<WalletDocument[]> {
    if (!userIds?.length) return [];

    const objectIds = userIds.map((id) =>
      typeof id === 'string' ? new Types.ObjectId(id) : id,
    );

    return await this.walletModel
      .find({
        userId: { $in: objectIds },
      })
      .session(session);
  }

  async getWalletBalance(walletId: string): Promise<number | null> {
    const id = new Types.ObjectId(walletId);
    const wallet = await this.walletModel.findById(id);
    return wallet?.balanceInKobo || null;
  }
}
