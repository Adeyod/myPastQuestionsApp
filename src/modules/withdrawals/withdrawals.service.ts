import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { generatePaymentReference } from '../../common/utils/helper';
import { AccountsService } from '../accounts/accounts.service';
import { AccountDocument } from '../accounts/schemas/accounts.schema';
import { MonnifyDisbursementError } from '../payments/providers/monnify/monnify-disbursement-error';
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
    if (!Number.isSafeInteger(dto.amountInKobo) || dto.amountInKobo <= 0) {
      throw new BadRequestException({
        message: 'Withdrawal amount must be a positive valid number.',
        success: false,
        status: 400,
      });
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    let withdrawal: any;
    let userAccount: AccountDocument;
    let wallet: WalletDocument | null;
    const id = user.sub.toString();

    try {
      wallet = await this.walletsRepo.findWalletByIdAndUserIdWithSession(
        dto.walletId,
        user.sub.toString(),
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

      console.log('userAccount:', userAccount);

      const reference = generatePaymentReference({ userId: id }, 'WITHDRAWAL');

      if (reference.length > 64) {
        throw new BadRequestException({
          message: 'Unable to generate a valid withdrawal reference.',
          success: false,
          status: 400,
        });
      }

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

      console.log('withdrawal:', withdrawal);

      wallet.balanceInKobo -= dto.amountInKobo;
      await wallet.save({ session });

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

      console.log('transaction:', transaction);

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

    try {
      const input = {
        bankCode: userAccount.bankCode,
        bankName: userAccount.bankName,
        accountNumber: userAccount.accountNumber,
        accountName: userAccount.accountName,
        amountInKobo: dto.amountInKobo,
        walletId: wallet._id.toString(),
        reference: withdrawal.reference,
        type: WebhookProcessionTransactionType.WITHDRAWAL,
      };

      console.log('payload going to monnify:', input);
      const monnifyResponse =
        await this.monnifyService.creditUserBankAccount(input);

      console.log('monnifyResponse:', monnifyResponse);

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
    } catch (error: unknown) {
      // monnify failed → COMPENSATING ACTION
      console.error('Withdrawal initiation error:', {
        reference: withdrawal.reference,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (
        error instanceof MonnifyDisbursementError &&
        error.outcome === 'REJECTED'
      ) {
        const result = await this.failWithdrawalAndRefund(
          withdrawal.reference,
          error.message,
        );

        console.log('result.status:', result.status);

        if (result.status !== WithdrawalStatus.FAILED) {
          console.error(
            'Withdrawal rejection requires reconciliation:',
            withdrawal.reference,
            result,
          );

          throw new InternalServerErrorException({
            success: false,
            message:
              'Your withdrawal is being verified. Please do not submit it again.',
            status: 500,
          });
        }

        throw new BadRequestException({
          message:
            'Your withdrawal could not be initiated. The amount has been returned to your wallet.',
          success: false,
          status: 400,
        });
      }

      console.log('error:', error);
      try {
        const updated = await this.withdrawalsRepo.updateStatus(
          withdrawal.reference,
          {
            status: WithdrawalStatus.RECONCILIATION_REQUIRED,
            failureReason:
              error instanceof Error
                ? error.message
                : 'Unknown transfer initiation error',
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

        if (!updated) {
          console.error(
            'Could not mark withdrawal for reconciliation:',
            withdrawal.reference,
          );
        }
      } catch (statusError) {
        // The withdrawal remains recorded.
        // Reconcile it using its unique reference before retrying or refunding.
        console.error(
          'Failed to update withdrawal status for reconciliation:',
          withdrawal.reference,
          statusError,
        );
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
        return await this.handleWithdrawalFailed({
          data: {
            reference,
            transactionReference: transfer.transactionReference,
            status: transfer.status,
            metadata: transfer,
          },
        });
        // return {
        //   message:
        //     'Monnify reports a failed or reversed transfer. Process the refund transaction.',
        //   providerStatus: transfer.status,
        //   reference,
        // };
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
    const { reference } = providerResponse.data;

    if (!reference) {
      throw new BadRequestException({
        message: 'Missing withdrawal reference',
        success: false,
        status: 400,
      });
    }

    const withdrawal = await this.withdrawalsRepo.findByReference(reference);

    console.log('withdrawal:', withdrawal);

    if (!withdrawal) return;

    if (withdrawal.status === WithdrawalStatus.SUCCESS) {
      return { message: 'Already processed' };
    }

    if (withdrawal.status === WithdrawalStatus.FAILED) {
      return {
        message:
          'Withdrawal is already marked as failed. Reconciliation is required.',
        status: withdrawal.status,
      };
    }

    const updated = await this.withdrawalsRepo.updateStatus(
      reference,
      {
        status: WithdrawalStatus.SUCCESS,
        providerReference: providerResponse.data.transactionReference,
        metadata: providerResponse,
        paidAt: new Date(),
      },
      [WithdrawalStatus.PROCESSING, WithdrawalStatus.PENDING],
    );

    if (!updated) {
      return {
        message: 'Withdrawal status changed. Check its current state.',
      };
    }

    return { message: 'Withdrawal successful', status: updated.status };
  }

  async handleWithdrawalFailed(providerResponse: any) {
    const { reference } = providerResponse.data;

    if (!reference) {
      throw new BadRequestException({
        message: 'Missing withdrawal reference.',
        success: false,
        status: 400,
      });
    }

    return await this.failWithdrawalAndRefund(
      reference,
      providerResponse?.data?.failureReason ??
        'Withdrawal failed according to provider notification.',
    );
  }
  // async handleWithdrawalFailed(providerResponse: any) {
  //   const { reference } = providerResponse.data;

  //   if (!reference) {
  //     throw new BadRequestException({
  //       message: 'Missing withdrawal reference.',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   const session = await this.connection.startSession();
  //   session.startTransaction();

  //   try {
  //     const withdrawal = await this.withdrawalsRepo.findByReferenceWithSession(
  //       reference,
  //       session,
  //     );

  //     console.log('withdrawal:', withdrawal);

  //     if (!withdrawal) {
  //       await session.abortTransaction();
  //       return { message: 'Withdrawal not found.' };
  //     }

  //     if (withdrawal.status === WithdrawalStatus.SUCCESS) {
  //       await session.abortTransaction();

  //       return {
  //         message: 'Withdrawal is already successful. No refund was issued.',
  //       };
  //     }

  //     if (withdrawal.status === WithdrawalStatus.FAILED) {
  //       await session.abortTransaction();
  //       return { message: 'Already processed' };
  //     }

  //     const failedWithdrawal =
  //       await this.withdrawalsRepo.updateStatusWithSession(
  //         reference,
  //         {
  //           status: WithdrawalStatus.FAILED,
  //         },
  //         session,
  //         [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING],
  //       );

  //     if (!failedWithdrawal) {
  //       await session.abortTransaction();

  //       return {
  //         message: 'Withdrawal status changed. Reconciliation is required.',
  //       };
  //     }

  //     await this.walletsRepo.creditUserWallet(
  //       failedWithdrawal.userId,
  //       failedWithdrawal.amountInKobo,
  //       session,
  //     );

  //     await this.transactionsRepo.createTransactionWithSession(
  //       {
  //         walletId: failedWithdrawal.walletId.toString(),
  //         amountInKobo: failedWithdrawal.amountInKobo,
  //         description: 'Refund for failed bank withdrawal',
  //         transactionType: TransactionType.CREDIT,
  //         category: TransactionCategoryEnum.GENERAL,
  //         withdrawalId: failedWithdrawal._id.toString(),
  //       },
  //       session,
  //     );

  //     await session.commitTransaction();

  //     return {
  //       message: 'Withdrawal failed and refunded',
  //       status: WithdrawalStatus.FAILED,
  //     };
  //   } catch (error) {
  //     if (session.inTransaction()) {
  //       await session.abortTransaction();
  //     }
  //     throw error;
  //   } finally {
  //     session.endSession();
  //   }
  // }

  async handleWithdrawalReversed(providerResponse: any) {
    const data = providerResponse?.data;

    const reference = data?.reference;
    const providerReference = data?.transactionReference;

    if (typeof reference !== 'string' || !reference.trim()) {
      throw new BadRequestException({
        message: 'Withdrawal reference is missing.',
        success: false,
        status: 400,
      });
    }

    const withdrawal = await this.withdrawalsRepo.findByReference(reference);

    if (!withdrawal) {
      throw new NotFoundException({
        message: 'Withdrawal not found.',
        success: false,
        status: 404,
      });
    }

    if (withdrawal.status === WithdrawalStatus.REVERSED_REFUNDED) {
      return {
        message: 'Withdrawal reversal has already been refunded.',
        status: withdrawal.status,
      };
    }

    if (withdrawal.status === WithdrawalStatus.FAILED) {
      return {
        message:
          'Withdrawal is already marked failed. Reconcile its existing refund before proceeding.',
        status: WithdrawalStatus.RECONCILIATION_REQUIRED,
        reference,
      };
    }

    const transfer = await this.monnifyService.getTransferStatus(reference);

    const transferStatus = String(transfer?.status ?? '').toUpperCase();

    if (transferStatus !== 'REVERSED') {
      return {
        message:
          'Monnify has not confirmed the transfer reversal. Reconciliation is required.',
        reference,
        providerStatus: transferStatus || 'UNKNOWN',
      };
    }

    const verifiedProviderReference =
      transfer?.transactionReference ?? transfer?.reference;

    if (
      providerReference &&
      verifiedProviderReference &&
      providerReference !== verifiedProviderReference
    ) {
      return {
        message:
          'The webhook and Monnify transfer references do not match. Manual reconciliation is required.',
        reference,
        status: WithdrawalStatus.RECONCILIATION_REQUIRED,
      };
    }

    const eligibleStatuses = [
      WithdrawalStatus.PROCESSING,
      WithdrawalStatus.SUCCESS,
      WithdrawalStatus.REVERSAL_PENDING,
      WithdrawalStatus.RECONCILIATION_REQUIRED,
    ];

    if (!eligibleStatuses.includes(withdrawal.status)) {
      return {
        message:
          'Withdrawal is not in an eligible state for automatic reversal refund.',
        reference,
        status: withdrawal.status,
      };
    }

    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const updatedWithdrawal =
        await this.withdrawalsRepo.updateStatusWithSession(
          reference,
          {
            status: WithdrawalStatus.REVERSED_REFUNDED,
            providerReference: verifiedProviderReference ?? providerReference,
            metadata: {
              ...(withdrawal.metadata ?? {}),
              reversal: {
                status: 'REVERSED',
                verifiedAt: new Date(),
                providerResponse: transfer,
              },
            },
          },
          session,
          eligibleStatuses,
        );

      if (!updatedWithdrawal) {
        await session.abortTransaction();

        return {
          message:
            'Withdrawal status changed concurrently. Reconciliation is required.',
          reference,
        };
      }

      const creditedWallet =
        await this.walletsRepo.creditWithdrawalRefundWithSession(
          withdrawal.walletId,
          withdrawal.userId,
          withdrawal.amountInKobo,
          session,
        );

      if (!creditedWallet) {
        throw new InternalServerErrorException({
          message:
            'Unable to credit the wallet. The reversal refund was not committed.',
          success: false,
          status: 500,
        });
      }

      await this.transactionsRepo.createTransactionWithSession(
        {
          walletId: withdrawal.walletId.toString(),
          amountInKobo: withdrawal.amountInKobo,
          description: 'Refund for reversed bank withdrawal',
          transactionType: TransactionType.CREDIT,
          category: TransactionCategoryEnum.GENERAL,
          withdrawalId: withdrawal._id.toString(),
        },
        session,
      );

      await session.commitTransaction();

      return {
        message: 'Withdrawal reversal confirmed and wallet refunded.',
        reference,
        status: WithdrawalStatus.REVERSED_REFUNDED,
      };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async failWithdrawalAndRefund(
    reference: string,
    failureReason?: string,
  ) {
    const session = await this.connection.startSession();

    try {
      console.log(
        'I want to update the user wallet balance because withdrawal failed',
        failureReason,
      );
      session.startTransaction();

      const withdrawal = await this.withdrawalsRepo.findByReferenceWithSession(
        reference,
        session,
      );

      if (!withdrawal) {
        await session.abortTransaction();

        return { message: 'Withdrawal not found.' };
      }

      if (
        withdrawal.status === WithdrawalStatus.SUCCESS ||
        withdrawal.status === WithdrawalStatus.REVERSED_REFUNDED
      ) {
        await session.abortTransaction();

        return {
          message: 'Withdrawal is not eligible for a failure refund.',
          status: withdrawal.status,
        };
      }

      if (withdrawal.status === WithdrawalStatus.FAILED) {
        await session.abortTransaction();

        return {
          message:
            'Withdrawal is already marked failed. Verify whether its refund was recorded.',
          status: withdrawal.status,
        };
      }

      const failedWithdrawal =
        await this.withdrawalsRepo.updateStatusWithSession(
          reference,
          {
            status: WithdrawalStatus.FAILED,
            failureReason,
          },
          session,
          [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING],
        );

      if (!failedWithdrawal) {
        await session.abortTransaction();

        return {
          message: 'Withdrawal status changed. Reconciliation is required.',
        };
      }

      const creditedWallet =
        await this.walletsRepo.creditWithdrawalRefundWithSession(
          failedWithdrawal.walletId,
          failedWithdrawal.userId,
          failedWithdrawal.amountInKobo,
          session,
        );

      if (!creditedWallet) {
        throw new InternalServerErrorException(
          'Unable to credit the withdrawal refund.',
        );
      }

      console.log('Credited Wallet ID:', creditedWallet._id);

      const trans = await this.transactionsRepo.createTransactionWithSession(
        {
          walletId: failedWithdrawal.walletId.toString(),
          amountInKobo: failedWithdrawal.amountInKobo,
          description: 'Refund for failed bank withdrawal',
          transactionType: TransactionType.CREDIT,
          category: TransactionCategoryEnum.GENERAL,
          withdrawalId: failedWithdrawal._id.toString(),
        },
        session,
      );

      console.log('transaction ID:', trans._id);

      await session.commitTransaction();

      return {
        message: 'Withdrawal failed and refunded.',
        status: WithdrawalStatus.FAILED,
      };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }
}
