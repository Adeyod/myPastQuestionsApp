import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { generatePaymentReference } from '../../common/utils/helper';
import { AccountsService } from '../accounts/accounts.service';
import { PaystackService } from '../payments/providers/paystack/paystack.service';
import { WebhookProcessionTransactionType } from '../payments/schemas/payment.schema';
import { TransactionsRepository } from '../transactions/repositories/transaction.repository';
import {
  TransactionCategoryEnum,
  TransactionType,
} from '../transactions/schemas/transaction.schema';
import { WalletsRepository } from '../wallets/repositories/wallets.repository';
import { RequestWithdrawalDto } from './dtos/request-withdrawal.dto';
import { WithdrawalsRepository } from './repositories/withdrawals.repository';
import { WithdrawalStatus } from './schemas/withdrawal.schema';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private withdrawalsRepo: WithdrawalsRepository,
    private walletsRepo: WalletsRepository,
    private readonly accountsService: AccountsService,
    private transactionsRepo: TransactionsRepository,
    private paystackService: PaystackService,
  ) {}

  // async requestWithdrawal(user: JwtUser, dto: RequestWithdrawalDto) {
  //   const session = await this.connection.startSession();
  //   session.startTransaction();

  //   const wallet = await this.walletsRepo.findWalletById(dto.walletId);

  //   if (!wallet || wallet.balance < dto.amount) {
  //     throw new BadRequestException({
  //       message: 'Insufficient balance',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   const id = user.sub.toString();

  //   const userAccount = await this.accountsService.getUserAccount(user, id);

  //   const payload = {
  //     userId: id,
  //     plan: 'BANK_WITHDRAWAL',
  //   };

  //   const reference = generatePaymentReference(payload, 'WITHDRAWAL');

  //   // 1. Create withdrawal record
  //   const withdrawal = await this.withdrawalsRepo.createWithdrawalDocument({
  //     userId: new Types.ObjectId(id),
  //     walletId: wallet._id,
  //     amount: dto.amount,
  //     reference,
  //     recipientCode: userAccount.transferRecipientCode,
  //     status: WithdrawalStatus.PENDING,
  //   });

  //   console.log('withdrawal:', withdrawal);

  //   // 2. Debit wallet
  //   wallet.balance -= dto.amount;
  //   await wallet.save();

  //   const response = await this.transactionsRepo.createTransaction({
  //     walletId: wallet._id.toString(),
  //     amount: dto.amount,
  //     description: 'Withdrawal request',
  //     transactionType: TransactionType.DEBIT,
  //     category: TransactionCategoryEnum.GENERAL,
  //     withdrawalId: withdrawal._id.toString(),
  //   });
  //   console.log('response:', response);

  //   try {
  //     // 3. Call Paystack
  //     const paystackResponse = await this.paystackService.creditUserBankAccount(
  //       {
  //         bankName: userAccount.bankName,
  //         accountNumber: userAccount.accountNumber,
  //         accountName: userAccount.accountName,
  //         recipientCode: userAccount.transferRecipientCode,
  //         amount: dto.amount,
  //         walletId: wallet._id.toString(),
  //         reference,
  //       },
  //     );
  //     console.log('paystackResponse:', paystackResponse);

  //     const updatedWithdrawalStatus = await this.withdrawalsRepo.updateStatus(
  //       reference,
  //       {
  //         status: WithdrawalStatus.PROCESSING,
  //         providerReference: paystackResponse.reference,
  //         metadata: response,
  //       },
  //     );
  //     console.log('updatedWithdrawalStatus:', updatedWithdrawalStatus);

  //     return {
  //       message: 'Withdrawal initiated',
  //     };
  //   } catch (error: any) {
  //     // rollback
  //     wallet.balance += dto.amount;
  //     await wallet.save();

  //     await this.withdrawalsRepo.updateStatus(reference, {
  //       status: WithdrawalStatus.FAILED,
  //       failureReason: error.message,
  //     });

  //     throw new BadRequestException('Transfer failed');
  //   }
  // }

  async requestWithdrawal(user: JwtUser, dto: RequestWithdrawalDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    let withdrawal: any;
    let wallet: any;
    const id = user.sub.toString();

    try {
      // Fetch wallet WITH session
      wallet = await this.walletsRepo.findWalletByIdWithSession(
        dto.walletId,
        session,
      );

      if (!wallet || wallet.balanceInKobo < dto.amountInKobo) {
        throw new BadRequestException('Insufficient balance');
      }

      const userAccount = await this.accountsService.getUserAccountWithSession(
        user,
        id,
        session,
      );

      const reference = generatePaymentReference(
        { userId: id, plan: 'BANK_WITHDRAWAL' },
        'WITHDRAWAL',
      );

      // Create withdrawal
      withdrawal =
        await this.withdrawalsRepo.createWithdrawalDocumentWithSession(
          {
            userId: new Types.ObjectId(id),
            walletId: wallet._id,
            amountInKobo: dto.amountInKobo,
            reference,
            recipientCode: userAccount.transferRecipientCode,
            status: WithdrawalStatus.PENDING,
          },
          session,
        );

      // Debit wallet
      wallet.balanceInKobo -= dto.amountInKobo;
      await wallet.save({ session });

      // Create transaction log
      const transaction =
        await this.transactionsRepo.createTransactionWithSession(
          {
            walletId: wallet._id.toString(),
            amountInKobo: dto.amountInKobo,
            description: 'Withdrawal request',
            transactionType: TransactionType.DEBIT,
            category: TransactionCategoryEnum.GENERAL,
            withdrawalId: withdrawal._id.toString(),
          },
          session,
        );

      // COMMIT FIRST (CRITICAL)
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    // 🚀 PHASE 2: Call Paystack OUTSIDE transaction
    try {
      const userAccount = await this.accountsService.getUserAccount(user, id);

      const paystackResponse = await this.paystackService.creditUserBankAccount(
        {
          bankName: userAccount.bankName,
          accountNumber: userAccount.accountNumber,
          accountName: userAccount.accountName,
          recipientCode: userAccount.transferRecipientCode,
          amount: dto.amountInKobo,
          walletId: wallet._id.toString(),
          reference: withdrawal.reference,
          type: WebhookProcessionTransactionType.WITHDRAWAL,
        },
      );

      // ✅ Update to PROCESSING
      const updatedStatus = await this.withdrawalsRepo.updateStatus(
        withdrawal.reference,
        {
          status: WithdrawalStatus.PROCESSING,
          providerReference: paystackResponse.reference,
          metadata: paystackResponse,
        },
      );

      console.log('updatedStatus:', updatedStatus);

      return {
        message: 'Withdrawal initiated',
      };
    } catch (error: any) {
      // Paystack failed → COMPENSATING ACTION
      const session2 = await this.connection.startSession();
      session2.startTransaction();

      try {
        // 1️⃣ Mark withdrawal FAILED
        await this.withdrawalsRepo.updateStatusWithSession(
          withdrawal.reference,
          {
            status: WithdrawalStatus.FAILED,
            failureReason: error.message,
          },
          session2,
        );

        // 2️⃣ Refund wallet
        await this.walletsRepo.creditUserWallet(
          withdrawal.userId,
          withdrawal.amountInKobo,
          session2,
        );

        await session2.commitTransaction();
      } catch (err) {
        await session2.abortTransaction();
        throw err;
      } finally {
        session2.endSession();
      }

      throw new BadRequestException('Transfer failed');
    }
  }

  async handleWithdrawalSuccess(providerResponse: any) {
    const {
      reference,
      metadata: { withdrawalId },
    } = providerResponse.data;

    const withdrawal = await this.withdrawalsRepo.findByReference(reference);

    console.log('withdrawal:', withdrawal);

    if (!withdrawal) return;

    if (withdrawal.status === WithdrawalStatus.SUCCESS) {
      return { message: 'Already processed' };
    }

    withdrawal.status = WithdrawalStatus.SUCCESS;
    await withdrawal.save();

    return { message: 'Withdrawal successful' };
  }

  async handleWithdrawalFailed(providerResponse: any) {
    const {
      reference,
      metadata: { withdrawalId },
    } = providerResponse.data;

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const withdrawal = await this.withdrawalsRepo.findByReferenceWithSession(
        reference,
        session,
      );

      console.log('withdrawal:', withdrawal);

      if (!withdrawal) {
        await session.abortTransaction();
        return;
      }

      // Idempotency check (VERY IMPORTANT)
      if (withdrawal.status === WithdrawalStatus.FAILED) {
        await session.abortTransaction();
        return { message: 'Already processed' };
      }

      // 1 Update withdrawal status
      withdrawal.status = WithdrawalStatus.FAILED;
      await withdrawal.save({ session });

      // 2 Refund wallet
      await this.walletsRepo.creditUserWallet(
        withdrawal.userId,
        withdrawal.amountInKobo,
        session,
      );

      // 3 Commit
      await session.commitTransaction();

      return { message: 'Withdrawal failed and refunded' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
