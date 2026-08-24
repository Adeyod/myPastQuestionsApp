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
import { UsersRepository } from '../users/repositories/users.repository';
import { Role } from '../users/schemas/user.schema';
import { WalletsRepository } from '../wallets/repositories/wallets.repository';
import { IPaymentProvider } from './providers/interfaces/provider.interface';
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
    private readonly walletsRepository: WalletsRepository,
    private readonly paystackService: PaystackService,
    private readonly plansService: PlansService,
    private readonly referralsService: ReferralsService,
    // private readonly flutterwaveService: flutterwaveService,
    private usersRepository: UsersRepository,
  ) {
    this.providerMap = {
      [PaymentProvider.PAYSTACK]: this.paystackService,
      // [PaymentProvider.FLUTTERWAVE]: this.flutterwaveService
    };
  }

  async createPaymentIntent(
    provider: PaymentProvider,
    plan: PlanCode,
    user: JwtUser,
  ) {
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
      type: WebhookProcessionTransactionType.PAYMENT,
    });

    const updateIntent = await this.paymentsRepository.updateIntentWithAuthUrl(
      createIntent._id,
      providerResponse.paymentUrl,
      providerResponse.providerReference,
    );
    return providerResponse;
  }

  // async verifyPayment(reference: string, user: JwtUser) {
  //   // 1️⃣ CHECK DB FIRST (faster + avoids unnecessary provider calls)
  //   const transaction =
  //     await this.paymentsRepository.findPaymentTransactionByReference(
  //       reference,
  //     );

  //   if (!transaction) {
  //     throw new NotFoundException({
  //       message: 'Transaction not found.',
  //       success: false,
  //       status: 404,
  //     });
  //   }

  //   // Ownership check
  //   if (transaction.userId.toString() !== user.sub.toString()) {
  //     throw new ForbiddenException({
  //       message: 'You are not authorized to access this transaction.',
  //       success: false,
  //       status: 403,
  //     });
  //   }

  //   // 2️⃣ IDEMPOTENCY CHECK (webhook might have already processed it)
  //   if (transaction.status === 'SUCCESSFUL') {
  //     return {
  //       message: 'Payment already verified.',
  //       success: true,
  //       status: 200,
  //       data: transaction,
  //     };
  //   }

  //   const provider = transaction.provider;
  //   const handler = this.providerMap[provider];

  //   if (!handler) {
  //     throw new BadRequestException({
  //       message: 'Unsupported provider.',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   // 3️⃣ VERIFY WITH PROVIDER (fallback if webhook hasn't hit yet)
  //   const providerRes = await handler.verifyPayment(reference);

  //   if (!providerRes || providerRes.status !== 'success') {
  //     throw new BadRequestException({
  //       message: 'Payment not successful yet.',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   // 4️⃣ VALIDATE DATA INTEGRITY
  //   if (transaction.amount !== providerRes.amount) {
  //     throw new BadRequestException({
  //       message: 'Payment details mismatch.',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   // 5️⃣ ONLY UPDATE STATUS (DO NOT CALL BUSINESS LOGIC)
  //   transaction.status = PaymentStatus.SUCCESSFUL;
  //   // transaction.providerResponse = providerRes;

  //   await transaction.save();

  //   return {
  //     message: 'Payment verified successfully.',
  //     success: true,
  //     status: 200,
  //     provider: transaction?.provider,
  //   };
  // }

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

    const providerRes = await handler.verifyPayment(reference);

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

  async handlePaymentWebhook(providerResponse: any) {
    const {
      reference,
      metadata: { amount, userId },
    } = providerResponse.data;

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const payment =
        await this.paymentsRepository.getPaymentByRefAndUserIdWithSession(
          reference,
          new Types.ObjectId(userId),
          session,
        );

      console.log('payment:', payment);

      if (!payment) throw new NotFoundException('Payment not found');

      // 🔐 Idempotency guard
      if (payment.status === PaymentStatus.SUCCESSFUL) {
        await session.abortTransaction();
        return { message: 'Already processed' };
      }

      // Verify with provider
      const verifyResponse =
        await this.providerMap[payment.provider].verifyPayment(reference);

      console.log('verifyResponse:', verifyResponse);

      if (verifyResponse.status !== 'success') {
        await session.abortTransaction();
        return { message: 'Verification failed' };
      }

      // ✅ Atomic update + business logic
      payment.status = PaymentStatus.SUCCESSFUL;
      payment.verified = true;
      await payment.save({ session });

      await this.processSuccessfulPayment(payment, session);

      await session.commitTransaction();

      return { message: 'Payment processed' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async processSuccessfulPayment(payment: PaymentDocument, session) {
    const userExist = await this.usersRepository.findByIdWithSession(
      payment.userId,
      session,
    );

    console.log('userExist:', userExist);

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

  // async handlePaymentWebhook(providerResponse: any) {
  //   const {
  //     reference,
  //     metadata: { amount, userId },
  //   } = providerResponse.data;

  //   const amt = Number(String(amount).replace(/,/g, ''));

  //   if (isNaN(amt)) {
  //     throw new BadRequestException({
  //       message: 'Invalid amount provided.',
  //       status: 400,
  //       success: false,
  //     });
  //   }

  //   const userObjectId = new Types.ObjectId(userId);

  //   const payment = await this.paymentsRepository.getPaymentByRefAndUserId(
  //     reference,
  //     userObjectId,
  //   );

  //   if (!payment) {
  //     throw new NotFoundException({
  //       message: 'Payment document not found.',
  //       status: 404,
  //       success: false,
  //     });
  //   }

  //   if (payment.verified) {
  //     return { message: 'Payment already processed.' };
  //   }

  //   const verifyResponse =
  //     await this.providerMap[PaymentProvider.PAYSTACK].verifyPayment(reference);

  //   if (verifyResponse.status !== 'success') {
  //     return { message: 'Payment verification failed.' };
  //   }

  //   const session = await this.connection.startSession();
  //   session.startTransaction();

  //   try {
  //     await this.paymentsRepository.updatePaymentStatusUsingPaymentId(
  //       payment._id,
  //       PaymentStatus.SUCCESSFUL,
  //       session,
  //     );

  //     const userExist = await this.usersRepository.findById(userObjectId);

  //     if (!userExist) {
  //       throw new NotFoundException({
  //         message: 'User not found',
  //         status: 404,
  //         success: false,
  //       });
  //     }

  //     userExist.plans.push(payment.plan);
  //     await userExist.save({ session });

  //     await session.commitTransaction();

  //     payment.verified = true;
  //     await payment.save({ session });

  //     // safe async
  //     this.referralsService
  //       .processReferralReward(userExist._id.toString(), amt / 100)
  //       .catch(console.error);

  //     return { message: 'Payment processed' };
  //   } catch (error) {
  //     await session.abortTransaction();
  //     throw error;
  //   } finally {
  //     session.endSession();
  //   }
  // }
}
