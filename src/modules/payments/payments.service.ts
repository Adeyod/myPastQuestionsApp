import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import { PlansService } from '../plans/plans.service';
import { PlanCode } from '../plans/schemas/plan.schema';
import { ReferralsService } from '../referrals/referrals.service';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersRepository } from '../users/repositories/users.repository';
import { Role } from '../users/schemas/user.schema';
import { WalletsService } from '../wallets/wallets.service';
import { IPaymentProvider } from './providers/interfaces/provider.interface';
import { MonnifyService } from './providers/monnify/monnify.service';
import { PaystackService } from './providers/paystack/paystack.service';
import { PaymentsRepository } from './repositories/payment.repository';
import {
  PaymentDocument,
  PaymentProvider,
  PaymentStatus,
  WebhookProcessionTransactionType,
} from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  private providerMap: Record<PaymentProvider, IPaymentProvider>;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly paystackService: PaystackService,
    private readonly monnifyService: MonnifyService,
    private readonly plansService: PlansService,
    private readonly referralsService: ReferralsService,
    private readonly transactionsService: TransactionsService,
    private readonly walletsService: WalletsService,
    // private readonly flutterwaveService: flutterwaveService,
    private usersRepository: UsersRepository,
  ) {
    this.providerMap = {
      [PaymentProvider.PAYSTACK]: this.paystackService,
      [PaymentProvider.MONNIFY]: this.monnifyService,
      // [PaymentProvider.FLUTTERWAVE]: this.flutterwaveService
    };
  }

  async createPaymentIntent(
    provider: PaymentProvider,
    plan: PlanCode,
    user: JwtUser,
  ) {
    console.log('provider:', provider);
    const findUser = await this.usersRepository.findById(user.sub);

    if (!findUser) {
      throw new NotFoundException({
        message: 'User not found.',
        success: false,
        status: 404,
      });
    }

    const planExist = await this.plansService.getPlanByCode(plan);

    if (!planExist) {
      throw new NotFoundException({
        message: 'Plan does not exist.',
        success: false,
        status: 404,
      });
    }

    const alreadyPaid = await this.paymentsRepository.findSuccessfulPaymentPlan(
      findUser._id,
      planExist.code,
    );

    if (alreadyPaid) {
      throw new UnauthorizedException({
        message: 'Plan already purchased.',
        success: false,
        status: 401,
      });
    }

    const status = PaymentStatus.PENDING;

    const findIntent =
      await this.paymentsRepository.existingPendingPaymentUsingUserIdAndPlan(
        findUser._id,
        planExist.code,
        status,
      );

    if (findIntent) {
      if (findIntent.expiresAt < new Date()) {
        await this.paymentsRepository.setPendingPaymentToExpired(
          findIntent._id,
        );
      } else if (findIntent.provider === provider) {
        return {
          provider: findIntent.provider,
          reference: findIntent.reference,
          paymentUrl: findIntent.authorizationUrl,
        };
      } else {
        await this.paymentsRepository.setPendingPaymentToExpired(
          findIntent._id,
        );
      }
    }
    const createIntent = await this.paymentsRepository.createPaymentIntent(
      findUser._id,
      provider,
      planExist,
    );

    if (!createIntent) {
      throw new BadRequestException({
        message: 'Unable to create payment document',
        success: false,
        status: 400,
      });
    }

    const handler = this.providerMap[provider];

    if (!handler) {
      throw new BadRequestException({
        message: 'Unsupported provider.',
        success: false,
        status: 400,
      });
    }

    const providerResponse = await handler.initializePayment({
      email: user.email,
      amount: createIntent.amountInKobo,
      ref: createIntent.reference,
      // reference: createIntent.reference,
      userId: findUser._id.toString(),
      userName: `${findUser.firstName} ${findUser.lastName}`,
      paymentDescription: 'Plan subscription',
      currencyCode: 'NGN',
      type: WebhookProcessionTransactionType.PAYMENT,
    });

    const updateIntent = await this.paymentsRepository.updateIntentWithAuthUrl(
      createIntent._id,
      providerResponse.paymentUrl,
      providerResponse.providerReference,
    );
    return providerResponse;
  }

  async verifyPayment(reference: string, user: JwtUser) {
    // 1️⃣ Check DB first
    const transaction =
      await this.paymentsRepository.findPaymentTransactionByReference(
        reference,
      );

    if (!transaction) {
      throw new NotFoundException({
        message: 'Transaction not found.',
        success: false,
        status: 404,
      });
    }

    // 2️⃣ Ownership check
    if (transaction.userId.toString() !== user.sub.toString()) {
      throw new ForbiddenException({
        message: 'You are not authorized to access this transaction.',
        success: false,
        status: 403,
      });
    }

    // 3️⃣ If webhook already processed it → RETURN immediately
    if (transaction.status === PaymentStatus.SUCCESSFUL) {
      return {
        message: 'Payment already verified.',
        success: true,
        status: 200,
        data: transaction,
      };
    }

    // 4️⃣ Fallback: verify with provider (NO DB WRITE)
    const provider = transaction.provider;
    const handler = this.providerMap[provider];

    if (!handler) {
      throw new BadRequestException({
        message: 'Unsupported provider.',
        success: false,
        status: 400,
      });
    }

    const providerRes = await handler.verifyTransaction(reference);

    if (!providerRes || providerRes.status !== 'success') {
      return {
        message: 'Payment not successful yet.',
        success: false,
        status: 400,
      };
    }

    // 5️⃣ Validate integrity
    if (transaction.amountInKobo !== providerRes.amount) {
      throw new BadRequestException({
        message: 'Payment details mismatch.',
        success: false,
        status: 400,
      });
    }

    // IMPORTANT: DO NOT UPDATE DATABASE HERE

    return {
      message:
        'Payment successful. Awaiting final confirmation (webhook processing).',
      success: true,
      status: 200,
      paymentStatus: 'SUCCESS_PENDING_WEBHOOK',
      provider: transaction.provider,
    };
  }

  async getAllPaymentsOfAUserByUserId(
    user: JwtUser,
    queryWithPaginationDto: QueryWithPaginationDto,
    userId: string,
  ) {
    const { sub, role } = user;

    if (role !== Role.ADMIN) {
      if (sub.toString() !== userId) {
        throw new UnauthorizedException({
          message: 'You can only access your payments.',
          success: false,
          status: 401,
        });
      }
    }

    const id = new Types.ObjectId(userId);
    const payments =
      await this.paymentsRepository.getAllPaymentsOfAUserWithUserId(
        id,
        queryWithPaginationDto,
      );

    if (!payments.paymentObj || payments.paymentObj.length === 0) {
      throw new NotFoundException({
        message: 'Payments not found.',
        success: false,
        status: 404,
      });
    }

    return payments;
  }

  async getAllPayments(queryWithPaginationDto: QueryWithPaginationDto) {
    const payments = await this.paymentsRepository.getAllPayments(
      queryWithPaginationDto,
    );

    if (!payments.paymentObj || payments.paymentObj.length === 0) {
      throw new NotFoundException({
        message: 'Payments not found.',
        success: false,
        status: 404,
      });
    }

    return payments;
  }

  async handlePaymentWebhook(
    provider: PaymentProvider,
    userId: string,
    reference: string,
  ) {
    console.log('payment service provider:', provider);
    console.log('payment service userId:', userId);
    console.log('payment service reference:', reference);

    if (!reference) {
      throw new BadRequestException({
        message: 'Missing payment reference.',
        success: false,
        status: 400,
      });
    }

    if (!userId) {
      throw new BadRequestException({
        message: 'Missing User ID.',
        success: false,
        status: 400,
      });
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const userObjectId = new Types.ObjectId(userId);

      const paymentDoc =
        await this.paymentsRepository.getPaymentByRefAndUserIdWithSession(
          reference,
          userObjectId,
          session,
        );

      console.log('paymentDoc:', paymentDoc);

      const transactionDoc = paymentDoc
        ? null
        : await this.transactionsService.getPendingWalletFundingByRefAndWalletIdWithSession(
            reference,
            userObjectId,
            session,
          );

      if (!paymentDoc && !transactionDoc) {
        throw new NotFoundException({
          message: 'Payment transaction not found',
          success: false,
          status: 404,
        });
      }

      if (paymentDoc) {
        if (paymentDoc.provider !== provider) {
          throw new BadRequestException({
            message: 'Payment provider does not match the stored transaction.',
            success: false,
            status: 400,
          });
        }

        if (paymentDoc.status === PaymentStatus.SUCCESSFUL) {
          await session.abortTransaction();
          return { message: 'Already processed' };
        }

        const verifyReference =
          paymentDoc.provider === PaymentProvider.MONNIFY
            ? paymentDoc.reference
            : paymentDoc.providerReference;

        const verifyResponse =
          await this.providerMap[paymentDoc.provider].verifyTransaction(
            verifyReference,
          );

        let verifiedAmountInKobo: number;
        let isSuccessful: boolean;

        if (paymentDoc.provider === PaymentProvider.MONNIFY) {
          isSuccessful = verifyResponse?.paymentStatus === 'PAID';
          verifiedAmountInKobo = Math.round(
            Number(verifyResponse?.amountPaid) * 100,
          );
        } else {
          isSuccessful = verifyResponse?.status === 'success';
          verifiedAmountInKobo = Number(verifyResponse?.amount);
        }

        if (!isSuccessful) {
          await session.abortTransaction();
          return { message: 'Payment verification failed.' };
        }

        if (
          !Number.isFinite(verifiedAmountInKobo) ||
          verifiedAmountInKobo !== paymentDoc.amountInKobo
        ) {
          throw new BadRequestException({
            message: 'Payment amount does not match the stored transaction.',
            success: false,
            status: 400,
          });
        }

        paymentDoc.status = PaymentStatus.SUCCESSFUL;
        paymentDoc.verified = true;
        paymentDoc.paidAt = new Date();
        await paymentDoc.save({ session });

        await this.processSuccessfulPayment(paymentDoc, session);
      } else if (transactionDoc) {
        if (transactionDoc.provider !== provider) {
          throw new BadRequestException({
            message: 'Payment provider does not match the stored transaction.',
            success: false,
            status: 400,
          });
        }

        if (transactionDoc.status === PaymentStatus.SUCCESSFUL) {
          await session.abortTransaction();
          return { message: 'Already processed' };
        }

        const verifyReference =
          transactionDoc.provider === PaymentProvider.MONNIFY
            ? transactionDoc.reference
            : transactionDoc.providerReference;

        if (!verifyReference) {
          throw new BadRequestException({
            message: 'Missing provider transaction reference.',
            success: false,
            status: 400,
          });
        }

        const verifyResponse =
          await this.providerMap[transactionDoc.provider].verifyTransaction(
            verifyReference,
          );

        let verifiedAmountInKobo: number;
        let isSuccessful: boolean;

        if (transactionDoc.provider === PaymentProvider.MONNIFY) {
          isSuccessful = verifyResponse?.paymentStatus === 'PAID';
          verifiedAmountInKobo = Math.round(
            Number(verifyResponse?.amountPaid) * 100,
          );
        } else {
          isSuccessful = verifyResponse?.status === 'success';
          verifiedAmountInKobo = Number(verifyResponse?.amount);
        }

        if (!isSuccessful) {
          await session.abortTransaction();
          return { message: 'Payment verification failed.' };
        }

        if (
          !Number.isFinite(verifiedAmountInKobo) ||
          verifiedAmountInKobo !== transactionDoc.amountInKobo
        ) {
          throw new BadRequestException({
            message: 'Payment amount does not match the stored transaction.',
            success: false,
            status: 400,
          });
        }

        transactionDoc.status = PaymentStatus.SUCCESSFUL;
        transactionDoc.verified = true;

        await this.walletsService.creditUserWalletByWalletIdAndAmountWithSession(
          transactionDoc.walletId,
          transactionDoc.amountInKobo,
          session,
        );

        await transactionDoc.save({ session });
      } else {
        throw new BadRequestException({
          message: 'Unsupported transaction type.',
          success: false,
          status: 400,
        });
      }

      await session.commitTransaction();

      return { message: 'Payment processed' };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async processSuccessfulPayment(payment: PaymentDocument, session) {
    const userExist = await this.usersRepository.findByIdWithSession(
      payment.userId,
      session,
    );

    if (!userExist) {
      throw new NotFoundException('User not found');
    }

    userExist.plans.push(payment.plan);
    await userExist.save({ session });

    // async safe
    await this.referralsService
      .processReferralRewardWithSession(
        userExist._id.toString(),
        payment.amountInKobo,
        session,
      )
      .catch(console.error);
  }
}
