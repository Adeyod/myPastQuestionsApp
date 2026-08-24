import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { generatePaymentReference } from '../../../common/utils/helper';
import { PlanCode, PlanDocument } from '../../plans/schemas/plan.schema';
import {
  Payment,
  PaymentDocument,
  PaymentProvider,
  PaymentStatus,
} from '../schemas/payment.schema';

type PaymentHandlerInput = {
  reference: string;
  amount: number;
  userId: Types.ObjectId;
};

export interface LegacyPayment {
  _id: Types.ObjectId;
  amount: number;
  amountInKobo?: number;
}

type PaymentHandler = (data: PaymentHandlerInput) => Promise<any>;

@Injectable()
export class PaymentsRepository {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
  ) {}

  async findPaidReferralsByUserIds(userIds: Types.ObjectId[]) {
    const response = await this.paymentModel.find({
      userId: { $in: userIds },
      status: PaymentStatus.SUCCESSFUL,
    });
    return response;
  }
  async createPaymentIntent(
    userId: Types.ObjectId,
    provider: PaymentProvider,
    planObj: PlanDocument,
  ) {
    const plan = planObj.code;

    const amountInKobo = planObj.priceInKobo;

    console.log('amountInKobo:', amountInKobo);
    if (!amountInKobo) {
      throw new BadRequestException({
        message: 'Invalid Plan selected.',
        success: false,
        status: 400,
      });
    }

    const payload = {
      plan,
      userId,
    };
    const reference = generatePaymentReference(payload, 'PAYMENT');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const newPayment = await new this.paymentModel({
      userId,
      plan,
      amountInKobo,
      reference,
      provider,
      expiresAt,
    }).save();

    return newPayment;
  }

  async getPaymentByRefAndUserId(
    reference: string,
    userId: Types.ObjectId,
  ): Promise<PaymentDocument | null> {
    const payment = await this.paymentModel.findOne({
      providerReference: reference,
      userId,
    });

    return payment;
  }
  async getPaymentByRefAndUserIdWithSession(
    reference: string,
    userId: Types.ObjectId,
    session: ClientSession,
  ): Promise<PaymentDocument | null> {
    const payment = await this.paymentModel
      .findOne({
        providerReference: reference,
        userId,
      })
      .session(session);

    return payment;
  }

  async updatePaymentStatusUsingPaymentId(
    paymentId: Types.ObjectId,
    status: PaymentStatus,
    session?: ClientSession,
  ): Promise<PaymentDocument | null> {
    const paidAt = new Date(Date.now());
    console.log('paidAt:', paidAt);
    const payment = await this.paymentModel.findByIdAndUpdate(
      paymentId,
      {
        status,
        paidAt,
      },
      {
        returnDocument: 'after',
        session,
      },
    );

    return payment;
  }

  async existingPendingPaymentUsingUserIdAndPlan(
    userId: Types.ObjectId,
    plan: PlanCode,
    status: PaymentStatus,
  ): Promise<PaymentDocument | null> {
    const existing = await this.paymentModel.findOne({
      userId,
      plan,
      status,
      expiresAt: { $gt: new Date() },
    });

    return existing;
  }

  async updateIntentWithAuthUrl(
    id: Types.ObjectId,
    authorizationUrl: string,
    providerReference: string,
  ): Promise<PaymentDocument | null> {
    const update = await this.paymentModel.findByIdAndUpdate(
      id,
      {
        authorizationUrl: authorizationUrl,
        providerReference: providerReference,
      },
      { returnDocument: 'after' },
    );

    return update;
  }

  async setPendingPaymentToExpired(
    id: Types.ObjectId,
  ): Promise<PaymentDocument | null> {
    const updateStatus = await this.paymentModel.findByIdAndUpdate(
      id,
      { status: PaymentStatus.EXPIRED },
      { returnDocument: 'after' },
    );

    return updateStatus;
  }

  async findSuccessfulPaymentPlan(
    userId: Types.ObjectId,
    plan: PlanCode,
  ): Promise<PaymentDocument | null> {
    const intent = await this.paymentModel.findOne({
      userId,
      plan,
      status: PaymentStatus.SUCCESSFUL,
      verified: true,
    });

    return intent;
  }

  async getAllPaymentsOfAUserWithUserId(
    userId: Types.ObjectId,
    queryWithPaginationsDto: QueryWithPaginationDto,
  ): Promise<{
    paymentObj: PaymentDocument[] | null;
    totalPages: number;
    totalCount: number;
  }> {
    const { page, limit, searchParams } = queryWithPaginationsDto;

    let query = this.paymentModel.find({ userId });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      const isBooleanSearch =
        searchParams.toLowerCase() === 'true' ||
        searchParams.toLowerCase() === 'false';

      query = query.where({
        $or: [
          { plan: { $regex: regex } },
          { provider: { $regex: regex } },
          { status: { $regex: regex } },
          ...(isBooleanSearch
            ? [{ verified: searchParams.toLowerCase() === 'true' }]
            : []),
        ],
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

    const payments = await query.sort({ createdAt: -1 });

    if (payments.length === 0) {
      throw new NotFoundException({
        message: 'Payments not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      paymentObj: payments,
    };

    return response;
  }

  async getAllPayments(
    queryWithPaginationsDto: QueryWithPaginationDto,
  ): Promise<{
    paymentObj: PaymentDocument[] | null;
    totalPages: number;
    totalCount: number;
  }> {
    const { page, limit, searchParams } = queryWithPaginationsDto;

    let query = this.paymentModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      const isBooleanSearch =
        searchParams.toLowerCase() === 'true' ||
        searchParams.toLowerCase() === 'false';

      query = query.where({
        $or: [
          { plan: { $regex: regex } },
          { provider: { $regex: regex } },
          { status: { $regex: regex } },
          ...(isBooleanSearch
            ? [{ verified: searchParams.toLowerCase() === 'true' }]
            : []),
        ],
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

    const payments = await query.sort({ createdAt: -1 });

    if (payments.length === 0) {
      throw new NotFoundException({
        message: 'Payments not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      paymentObj: payments,
    };

    return response;
  }

  async findPaymentTransactionByReference(
    reference: string,
  ): Promise<PaymentDocument | null> {
    const paymentTransaction = await this.paymentModel.findOne({
      providerReference: reference,
    });

    return paymentTransaction;
  }

  // async migratePaymentAmountsToKobo() {
  //   const payments = (await this.paymentModel
  //     .find({
  //       amount: { $exists: true },
  //       amountInKobo: { $exists: false },
  //     })
  //     .lean()) as unknown as LegacyPayment[];

  //   console.log(`Found ${payments.length} payments to migrate.`);

  //   let migratedCount = 0;

  //   for (const payment of payments) {
  //     const amountInKobo = Math.round(payment.amount * 100);

  //     await this.paymentModel.updateOne(
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

/**
 * findSuccessfulPaymentPlan
 * existingPendingPaymentUsingUserIdAndPlan
 */
