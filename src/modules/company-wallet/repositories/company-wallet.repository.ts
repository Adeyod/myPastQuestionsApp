import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import {
  CompanyWallet,
  CompanyWalletDocument,
} from '../schemas/company-wallet.schema';

@Injectable()
export class CompanyWalletRepository {
  constructor(
    @InjectModel('CompanyWallet')
    private companyWallet: Model<CompanyWalletDocument>,
  ) {}

  async creditWallet(
    name: string,
    amountInKobo: number,
    session: ClientSession,
  ) {
    const response = await this.companyWallet
      .findOneAndUpdate(
        { name },
        { $inc: { balanceInKobo: amountInKobo } },
        { returnDocument: 'after' },
      )
      .session(session);

    return response;
  }

  async findByName(
    name: string,
    session: ClientSession,
  ): Promise<CompanyWalletDocument | null> {
    const response = await this.companyWallet
      .findOne({ name })
      .session(session);

    return response;
  }

  async createWallet(data: Partial<CompanyWallet>, session: ClientSession) {
    const response = await new this.companyWallet(data).save({ session });

    return response;
  }
}
