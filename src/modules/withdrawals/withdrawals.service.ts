import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { generatePaymentReference } from '../../common/utils/helper';
import { AccountsService } from '../accounts/accounts.service';
import { AccountDocument } from '../accounts/schemas/accounts.schema';
import { MonnifyService } from '../payments/providers/monnify/monnify.service';
import { WebhookProcessionTransactionType } from '../payments/schemas/payment.schema';
import { TransactionsRepository } from '../transactions/repositories/transaction.repository';
import {
  TransactionCategoryEnum,
  TransactionType,
} from '../transactions/schemas/transaction.schema';
import { WalletsRepository } from '../wallets/repositories/wallets.repository';
import { WalletDocument } from '../wallets/schemas/wallet.schema';
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
    private monnifyService: MonnifyService,
  ) {}

  async requestWithdrawal(user: JwtUser, dto: RequestWithdrawalDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    let withdrawal: any;
    let userAccount: AccountDocument;
    let wallet: WalletDocument | null;
    const id = user.sub.toString();

    try {
      // Fetch wallet WITH session
      wallet = await this.walletsRepo.findWalletByIdWithSession(
        dto.walletId,
        session,
      );

      if (!wallet || wallet.balanceInKobo < dto.amountInKobo) {
        throw new BadRequestException({
          message: 'Insufficient balance',
          success: false,
          status: 400,
        });
      }

      userAccount = await this.accountsService.getUserAccountWithSession(
        user,
        id,
        session,
      );

      if (
        !userAccount.accountName ||
        !userAccount.accountNumber ||
        !userAccount.transferRecipientCode
      ) {
        throw new BadRequestException({
          message: 'Your bank account details are incomplete.',
          success: false,
          status: 400,
        });
      }

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
            destinationAccountName: userAccount.accountName,
            destinationAccountNumber: userAccount.accountNumber,
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

    const claimedWithdrawal = await this.withdrawalsRepo.updateStatus(
      withdrawal.reference,
      {
        status: WithdrawalStatus.PROCESSING,
      },
      [WithdrawalStatus.PENDING],
    );

    if (!claimedWithdrawal) {
      throw new BadRequestException({
        message:
          'This withdrawal is already being processed or its status has changed.',
        success: false,
        status: 400,
      });
    }

    // 🚀 PHASE 2: Call monnify OUTSIDE transaction
    try {
      const monnifyResponse = await this.monnifyService.creditUserBankAccount({
        bankCode: userAccount.transferRecipientCode,
        bankName: userAccount.bankName,
        accountNumber: userAccount.accountNumber,
        accountName: userAccount.accountName,
        amountInKobo: dto.amountInKobo,
        walletId: wallet._id.toString(),
        reference: withdrawal.reference,
        type: WebhookProcessionTransactionType.WITHDRAWAL,
      });

      // Update to PROCESSING
      const updatedStatus = await this.withdrawalsRepo.updateStatus(
        withdrawal.reference,
        {
          status: WithdrawalStatus.PROCESSING,
          providerReference:
            monnifyResponse.transactionReference ?? monnifyResponse.reference,
          metadata: monnifyResponse,
        },
        [WithdrawalStatus.PROCESSING],
      );

      if (!updatedStatus) {
        throw new BadRequestException({
          message:
            'Transfer may have been initiated. Reconcile this withdrawal with Monnify.',
          success: false,
          status: 400,
        });
      }

      console.log('updatedStatus:', updatedStatus);

      return {
        message: 'Withdrawal initiated and is being processed.',
        status: updatedStatus.status,
      };
    } catch (error: any) {
      // monnify failed → COMPENSATING ACTION

      try {
        await this.withdrawalsRepo.updateStatus(
          withdrawal.reference,
          {
            status: WithdrawalStatus.PROCESSING,
            metadata: {
              initiationOutcome: 'UNKNOWN',
              reconciliationRequired: true,
              errorMessage:
                error instanceof Error
                  ? error.message
                  : 'Unknown transfer initiation error',
            },
          },
          [WithdrawalStatus.PROCESSING],
        );
      } catch {
        // The withdrawal remains recorded.
        // Reconcile it using its unique reference before retrying or refunding.
      }

      throw new BadRequestException({
        message:
          'Your withdrawal request is being checked. Please do not submit it again.',
        success: false,
        status: 400,
      });
    }
  }

  async reconcileWithdrawal(reference: string) {
    const withdrawal = await this.withdrawalsRepo.findByReference(reference);

    if (!withdrawal) {
      throw new NotFoundException({
        message: 'Withdrawal not found.',
        success: false,
        status: 404,
      });
    }

    if (
      withdrawal.status === WithdrawalStatus.SUCCESS ||
      withdrawal.status === WithdrawalStatus.FAILED
    ) {
      return {
        message: 'Withdrawal has already reached a final status',
        status: withdrawal.status,
      };
    }

    const transfer = await this.monnifyService.getTransferStatus(reference);

    /**
     * Important: this is a starting point for reconciliation,
     * not the complete production refund workflow. In particular,
     * the success branch should also be implemented with an atomic,
     * idempotent state transition, and the failure branch needs a
     * MongoDB transaction that marks the withdrawal failed and
     * credits the wallet exactly once. Your existing
     * handleWithdrawalFailed() should be refactored to share that
     * same refund logic.
     */
    switch (transfer.status) {
      case 'SUCCESS':
      case 'COMPLETED': {
        const updated = await this.withdrawalsRepo.updateStatus(
          reference,
          {
            status: WithdrawalStatus.SUCCESS,
            providerReference: transfer.transactionReference,
            metadata: transfer,
            paidAt: new Date(),
          },
          [WithdrawalStatus.PROCESSING, WithdrawalStatus.PENDING],
        );

        return {
          message: updated
            ? 'Withdrawal confirmed successful'
            : 'Withdrawal status changed; check its current state.',
          status: updated?.status,
        };
      }

      case 'FAILED':
      case 'REVERSED':
      case 'EXPIRED': {
        return {
          message:
            'Monnify reports a failed or reversed transfer. Process the refund transaction.',
          providerStatus: transfer.status,
          reference,
        };
      }

      default:
        return {
          message: 'Transfer is not yet final. Check again later.',
          providerStatus: transfer.status,
          reference,
        };
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
