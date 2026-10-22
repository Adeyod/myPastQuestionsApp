import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import { PaymentProvider } from '../payments/schemas/payment.schema';
import { UsersRepository } from '../users/repositories/users.repository';
import { Role } from '../users/schemas/user.schema';
import { WalletsRepository } from '../wallets/repositories/wallets.repository';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionsRepository } from './repositories/transaction.repository';
import {
  TransactionCategoryEnum,
  TransactionType,
} from './schemas/transaction.schema';

@Injectable()
export class TransactionsService {
  constructor(
    private transactionsRepository: TransactionsRepository,
    private usersRepository: UsersRepository,
    @Inject(forwardRef(() => WalletsRepository))
    private walletsRepository: WalletsRepository,
  ) {
    // console.log('transactionsRepository', this.transactionsRepository);
  }

  async getTransactionById(
    transactionId: string,
  ): Promise<TransactionResponseDto> {
    const transaction =
      await this.transactionsRepository.getTransactionById(transactionId);

    if (!transaction) {
      throw new NotFoundException({
        message: 'Transaction not found.',
        status: 404,
        success: false,
      });
    }

    return transaction;
  }

  async getAllUserTransactionByUserId(
    user: JwtUser,
    userId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const id = new Types.ObjectId(userId);

    if (user.role === Role.USER) {
      if (userId !== user.sub.toString()) {
        throw new ForbiddenException({
          message: 'Access denied. This transactions does not belong to you.',
          success: false,
          status: 403,
        });
      }
    }

    const userExist = await this.usersRepository.findById(id);

    if (!userExist) {
      throw new NotFoundException({
        message: 'User not found.',
        success: false,
        status: 404,
      });
    }

    const wallet = await this.walletsRepository.findWalletByUserId(
      userExist._id.toString(),
    );

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found.',
        status: 404,
        success: false,
      });
    }

    const transactions =
      await this.transactionsRepository.getAllUserTransactionsByWalletId(
        wallet._id,
        queryWithPaginationDto,
      );

    if (
      !transactions.transactionObj ||
      transactions.transactionObj.length === 0
    ) {
      throw new NotFoundException({
        message: 'Transactions not found.',
        success: false,
        status: 404,
      });
    }

    return transactions;
  }

  async getAllTransactions(queryWithPaginationDto: QueryWithPaginationDto) {
    const transactions = await this.transactionsRepository.getAllTransactions(
      queryWithPaginationDto,
    );

    if (!transactions) {
      throw new NotFoundException({
        message: 'Transactions not found.',
        status: 404,
        success: false,
      });
    }

    return transactions;
  }

  async createTransaction(
    walletId: string,
    amountInKobo: number,
    description: string,
    category: TransactionCategoryEnum,
    transactionType: TransactionType,
    provider: PaymentProvider,
    reference: string,
  ) {
    const payload = {
      walletId,
      amountInKobo,
      description,
      category,
      transactionType,
      provider,
      reference,
    };
    const response =
      await this.transactionsRepository.createTransaction(payload);

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to create transaction record.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async updateTransactionByTransactionId(
    transactionId: string,
    paymentUrl: string,
    providerReference: string,
  ) {
    const transaction = await this.transactionsRepository.updateWithPaymentURL(
      transactionId,
      paymentUrl,
      providerReference,
    );

    if (!transaction) {
      throw new NotFoundException({
        message: 'Transaction not found.',
        success: false,
        status: 404,
      });
    }

    return transaction;
  }

  async getPendingWalletFundingByRefAndWalletIdWithSession(
    reference: string,
    walletId: Types.ObjectId,
    session: ClientSession,
  ) {
    const response =
      await this.transactionsRepository.getPendingWalletFundingByRefAndWalletIdWithSession(
        reference,
        walletId,
        session,
      );

    if (!response) {
      throw new NotFoundException({
        message: 'Transaction not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async getTransactionByInHouseReference(reference: string) {
    const response =
      await this.transactionsRepository.getTransactionByInHouseReference(
        reference,
      );

    if (!response) {
      throw new NotFoundException({
        message: 'Transaction not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }
  async getTransactionByProviderReference(reference: string) {
    const response =
      await this.transactionsRepository.getTransactionByProviderReference(
        reference,
      );

    if (!response) {
      throw new NotFoundException({
        message: 'Transaction not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }
}
