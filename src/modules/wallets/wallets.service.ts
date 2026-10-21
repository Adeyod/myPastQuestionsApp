import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';
import { ExamType } from '../../common/enums/exam-type.enum';
import { JwtUser } from '../../common/types/jwt-user.type';
import { generatePaymentReference } from '../../common/utils/helper';
import { CompanyWalletService } from '../company-wallet/company-wallet.service';
import { IPaymentProvider } from '../payments/providers/interfaces/provider.interface';
import { MonnifyService } from '../payments/providers/monnify/monnify.service';
import { PaystackService } from '../payments/providers/paystack/paystack.service';
import {
  PaymentProvider,
  WebhookProcessionTransactionType,
} from '../payments/schemas/payment.schema';
import {
  TransactionCategoryEnum,
  TransactionType,
} from '../transactions/schemas/transaction.schema';
import { TransactionsService } from '../transactions/transactions.service';
import { Role } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { WalletsRepository } from './repositories/wallets.repository';

@Injectable()
export class WalletsService {
  private providerMap: Record<PaymentProvider, IPaymentProvider>;
  constructor(
    private readonly walletsRepository: WalletsRepository,
    private readonly companyWalletService: CompanyWalletService,
    private readonly paystackService: PaystackService,
    private readonly monnifyService: MonnifyService,
    private readonly usersService: UsersService,
    private readonly transactionService: TransactionsService,
  ) {
    this.providerMap = {
      [PaymentProvider.PAYSTACK]: this.paystackService,
      [PaymentProvider.MONNIFY]: this.monnifyService,
      // [PaymentProvider.FLUTTERWAVE]: this.flutterwaveService
    };
  }

  async chargeForPracticeQuestions(data: {
    userWalletId: string;
    amountInKobo: number;
    questionCount: number;
    examType: ExamType;
    subjectId: string;
    session: ClientSession;
  }) {
    const payload = {
      walletId: data.userWalletId,
      amountInKobo: data.amountInKobo,
      description: `Charges for ${data.questionCount} practice questions.`,
    };
    const debitWallet = await this.walletsRepository.chargeWallet(payload);

    console.log('debitWallet:', debitWallet);

    const companyWallet =
      await this.companyWalletService.getOrCreateCompanyWallet(data.session);
    console.log('companyWallet:', companyWallet);

    const creditCompanyWallet = await this.companyWalletService.creditWallet(
      data.amountInKobo,
      data.session,
    );
    console.log('creditCompanyWallet:', creditCompanyWallet);

    return debitWallet;
  }
  async findWalletByUserId(userId: string, user: JwtUser) {
    if (user.role !== Role.ADMIN) {
      if (user.sub.toString() !== userId) {
        throw new ForbiddenException({
          message: 'You can only have access to your own wallet.',
          success: false,
          status: 403,
        });
      }
    }

    const wallet = await this.walletsRepository.findWalletByUserId(userId);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found.',
        status: 404,
        success: false,
      });
    }

    return wallet;
  }

  async findWalletById(walletId: string, user: JwtUser) {
    const wallet = await this.walletsRepository.findWalletById(walletId);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found.',
        status: 404,
        success: false,
      });
    }

    if (user.role !== Role.ADMIN) {
      if (user.sub.toString() !== wallet.userId.toString()) {
        throw new ForbiddenException({
          message: 'You can only have access to your own wallet.',
          success: false,
          status: 403,
        });
      }
    }

    return wallet;
  }

  async getWalletBalance(walletId: string, user: JwtUser) {
    const wallet = await this.walletsRepository.findWalletById(walletId);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found.',
        status: 404,
        success: false,
      });
    }

    if (user.role !== Role.ADMIN) {
      if (user.sub.toString() !== wallet.userId.toString()) {
        throw new ForbiddenException({
          message: 'You can only have access to your own wallet.',
          success: false,
          status: 403,
        });
      }
    }

    return wallet.balanceInKobo;
  }

  async fundUserWalletFromPaymentGatewayProvider(
    walletId: string,
    amountInKobo: number,
    provider: PaymentProvider,
    user: JwtUser,
  ) {
    const findUser = await this.usersService.findUserById(user.sub);

    const wallet = await this.walletsRepository.findWalletById(walletId);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found.',
        status: 404,
        success: false,
      });
    }

    const description = 'User funding wallet.';
    const category = TransactionCategoryEnum.GENERAL;
    const transactionType = TransactionType.CREDIT;
    const userId = wallet._id.toString();

    const input = {
      userId,
    };
    const reference = generatePaymentReference(input, 'FUND_WALLET');

    const pendingTransaction = await this.transactionService.createTransaction(
      wallet._id.toString(),
      amountInKobo,
      description,
      category,
      transactionType,
      provider,
      reference,
    );

    const handler = this.providerMap[provider];

    if (!handler) {
      throw new BadRequestException({
        message: 'Unsupported provider.',
        success: false,
        status: 400,
      });
    }

    const payload = {
      email: user.email,
      amount: amountInKobo,
      ref: reference,
      userId: userId,
      userName: `${findUser.firstName} ${findUser.lastName}`,
      paymentDescription: description,
      currencyCode: 'NGN',
      type: WebhookProcessionTransactionType.FUND_WALLET,
    };

    const providerResponse = await handler.initializePayment(payload);

    const updateTransaction =
      await this.transactionService.updateTransactionByTransactionId(
        pendingTransaction._id.toString(),
        providerResponse.paymentUrl,
        providerResponse.providerReference,
      );

    return providerResponse;
  }

  async creditUserWalletByWalletIdAndAmountWithSession(
    walletId: Types.ObjectId,
    amountInKobo: number,
    session: ClientSession,
  ) {
    const response = await this.walletsRepository.fundWalletFromBankWithSession(
      walletId,
      amountInKobo,
      session,
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to credit wallet.',
        success: false,
        status: 400,
      });
    }

    return response;
  }
}
