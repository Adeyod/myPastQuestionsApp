import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';

import { JwtUser } from '../../common/types/jwt-user.type';
import {
  PracticePointTransactionCategory,
  PracticePointTransactionType,
} from './schemas/practice-point-transaction.schema';

import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { Role } from '../users/schemas/user.schema';
import { PracticePointTransactionRepository } from './repositories/practice-point-transaction.repository';
import { PracticeWalletRepository } from './repositories/practice-wallet.repository';

@Injectable()
export class PracticeWalletService {
  constructor(
    private readonly practiceWalletRepository: PracticeWalletRepository,
    private readonly practicePointTransactionRepository: PracticePointTransactionRepository,
  ) {}

  async getOrCreateUserPracticeWallet(user: JwtUser) {
    const userId = new Types.ObjectId(user.sub);

    const wallet =
      await this.practiceWalletRepository.findOrCreateByUserId(userId);

    return wallet;
  }

  async getPracticeWalletByPracticeWalletId(
    user: JwtUser,
    practiceWalletId: string,
  ) {
    const id = new Types.ObjectId(practiceWalletId);

    const wallet = await this.practiceWalletRepository.findById(id);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Practice wallet not found.',
        success: false,
        status: 404,
      });
    }

    if (user.role !== Role.ADMIN) {
      if (wallet.userId.toString() !== user.sub.toString()) {
        throw new ForbiddenException({
          message: 'You can only access your personal practice wallet.',
          success: false,
          status: 403,
        });
      }
    }

    return wallet;
  }
  async getMyPracticeWallet(user: JwtUser, userId: string) {
    const id = new Types.ObjectId(user.sub);

    if (userId !== user.sub.toString()) {
      throw new ForbiddenException({
        message: 'You can only access your personal practice wallet.',
        success: false,
        status: 403,
      });
    }

    const wallet = await this.practiceWalletRepository.findByUserId(id);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Practice wallet not found.',
        success: false,
        status: 404,
      });
    }

    return wallet;
  }

  async creditPracticePoints(data: {
    userId: string;
    points: number;
    practiceId?: string;
    description: string;
    session: ClientSession;
  }) {
    const userId = new Types.ObjectId(data.userId);
    const session = data.session;

    if (data.points <= 0) {
      throw new BadRequestException({
        message: 'Points to be credited must be greater than zero.',
        success: false,
        status: 400,
      });
    }

    const wallet =
      await this.practiceWalletRepository.findOrCreateByUserIdWithSession(
        userId,
        session,
      );

    if (data.practiceId) {
      const existingTransaction =
        await this.practicePointTransactionRepository.findByPracticeId(
          new Types.ObjectId(data.practiceId),
          session,
        );

      if (existingTransaction) {
        throw new BadRequestException({
          message: 'Points have already been awarded for this practice.',
          success: false,
          status: 400,
        });
      }
    }

    const updatedWallet = await this.practiceWalletRepository.incrementPoints(
      wallet._id,
      data.points,
      session,
    );

    if (!updatedWallet) {
      throw new BadRequestException({
        message: 'Unable to credit practice points.',
        success: false,
        status: 400,
      });
    }

    await this.practicePointTransactionRepository.createWithSession(
      {
        practiceWalletId: wallet._id,
        points: data.points,
        type: PracticePointTransactionType.CREDIT,
        category: PracticePointTransactionCategory.PRACTICE_REWARD,
        description: data.description,
        practiceId: data.practiceId
          ? new Types.ObjectId(data.practiceId)
          : undefined,
      },
      session,
    );

    return updatedWallet;
  }

  async debitPracticePoints(data: {
    userId: string;
    points: number;
    description: string;
    contestId?: string;
  }) {
    const userId = new Types.ObjectId(data.userId);

    if (data.points <= 0) {
      throw new BadRequestException({
        message: 'Points to be debited must be greater than zero.',
        success: false,
        status: 400,
      });
    }

    const wallet = await this.practiceWalletRepository.findByUserId(userId);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Practice wallet not found.',
        success: false,
        status: 404,
      });
    }

    const updatedWallet = await this.practiceWalletRepository.decrementPoints(
      wallet._id,
      data.points,
    );

    if (!updatedWallet) {
      throw new BadRequestException({
        message: 'Insufficient practice points.',
        success: false,
        status: 400,
      });
    }

    await this.practicePointTransactionRepository.create({
      practiceWalletId: wallet._id,
      points: data.points,
      type: PracticePointTransactionType.DEBIT,
      category: PracticePointTransactionCategory.SOLVE_AND_WIN_ENTRY,
      description: data.description,
      contestId: data.contestId
        ? new Types.ObjectId(data.contestId)
        : undefined,
    });

    return updatedWallet;
  }

  async getUserPracticePointTransactions(
    user: JwtUser,
    userId: string,
    queryDto: QueryWithPaginationDto,
  ) {
    const id = new Types.ObjectId(user.sub);

    if (userId !== user.sub.toString()) {
      throw new ForbiddenException({
        message:
          'You can only access your personal practice point transactions.',
        success: false,
        status: 403,
      });
    }

    const wallet = await this.practiceWalletRepository.findByUserId(id);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Practice wallet not found.',
        success: false,
        status: 404,
      });
    }

    return await this.practicePointTransactionRepository.findByWalletId(
      wallet._id,
      queryDto,
    );
  }
}
