import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import {
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
    payload: {
      status: WithdrawalStatus;
      providerReference?: string;
      metadata?: any;
      failureReason?: string;
    },
  ) {
    const { status, providerReference, metadata } = payload;

    const response = await this.withdrawalModel.findOneAndUpdate(
      { reference },
      { status, providerReference, metadata },
      { returnDocument: 'after' },
    );
    return response;
  }
  async updateStatusWithSession(
    reference: string,
    payload: {
      status: WithdrawalStatus;
      providerReference?: string;
      metadata?: any;
      failureReason?: string;
    },
    session: ClientSession,
  ) {
    const { status, providerReference, metadata } = payload;

    const response = await this.withdrawalModel
      .findOneAndUpdate(
        { reference },
        { status, providerReference, metadata },
        { returnDocument: 'after' },
      )
      .session(session);
    return response;
  }
}
