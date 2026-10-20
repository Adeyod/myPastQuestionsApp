import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import {
  UpdateWithdrawalStatusPayload,
  Withdrawal,
  WithdrawalDocument,
  WithdrawalStatus,
} from '../schemas/withdrawal.schema';

@Injectable()
export class WithdrawalsRepository {
  constructor(
    @InjectModel(Withdrawal.name)
    private withdrawalModel: Model<WithdrawalDocument>,
  ) {}

  async createWithdrawalDocumentWithSession(
    data: Partial<Withdrawal>,
    session: ClientSession,
  ) {
    const response = await new this.withdrawalModel(data).save({ session });

    return response;
  }
  async createWithdrawalDocument(data: Partial<Withdrawal>) {
    const response = await new this.withdrawalModel(data).save();

    return response;
  }

  async findByReferenceWithSession(reference: string, session: ClientSession) {
    const response = await this.withdrawalModel
      .findOne({ reference })
      .session(session);

    return response;
  }
  async findByReference(reference: string) {
    const response = await this.withdrawalModel.findOne({ reference });

    return response;
  }

  async updateStatus(
    reference: string,
    payload: UpdateWithdrawalStatusPayload,
    expectedStatuses?: WithdrawalStatus[],
  ) {
    const filter: Record<string, any> = { reference };

    if (expectedStatuses?.length) {
      filter.status = { $in: expectedStatuses };
    }

    const update: Record<string, any> = {
      status: payload.status,
    };

    if (payload.providerReference !== undefined) {
      update.providerReference = payload.providerReference;
    }

    if (payload.metadata !== undefined) {
      update.metadata = payload.metadata;
    }

    if (payload.failureReason !== undefined) {
      update.failureReason = payload.failureReason;
    }

    if (payload.paidAt !== undefined) {
      update.paidAt = payload.paidAt;
    }

    const response = await this.withdrawalModel.findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: 'after' },
    );
    return response;
  }
  async updateStatusWithSession(
    reference: string,
    payload: UpdateWithdrawalStatusPayload,
    session: ClientSession,
    expectedStatuses?: WithdrawalStatus[],
  ) {
    const filter: Record<string, any> = { reference };

    if (expectedStatuses?.length) {
      filter.status = { $in: expectedStatuses };
    }

    const update: Record<string, any> = {
      status: payload.status,
    };

    if (payload.providerReference !== undefined) {
      update.providerReference = payload.providerReference;
    }

    if (payload.metadata !== undefined) {
      update.metadata = payload.metadata;
    }

    if (payload.failureReason !== undefined) {
      update.failureReason = payload.failureReason;
    }

    if (payload.paidAt !== undefined) {
      update.paidAt = payload.paidAt;
    }

    const response = await this.withdrawalModel.findOneAndUpdate(
      filter,
      { $set: update },
      { session, returnDocument: 'after' },
    );
    return response;
  }
  // async updateStatusWithSession(
  //   reference: string,
  //   payload: {
  //     status: WithdrawalStatus;
  //     providerReference?: string;
  //     metadata?: any;
  //     failureReason?: string;
  //   },
  //   session: ClientSession,
  // ) {
  //   const { status, providerReference, metadata } = payload;

  //   const response = await this.withdrawalModel
  //     .findOneAndUpdate(
  //       { reference },
  //       { status, providerReference, metadata },
  //       { returnDocument: 'after' },
  //     )
  //     .session(session);
  //   return response;
  // }
}
