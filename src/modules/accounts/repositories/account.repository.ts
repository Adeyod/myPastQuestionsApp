import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { CreateAccountDto } from '../dtos/create-account.dto';
import { Account, AccountDocument } from '../schemas/accounts.schema';

@Injectable()
export class AccountsRepository {
  constructor(
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
  ) {}
  async createAccount(
    userId: Types.ObjectId,
    createAccountDto: CreateAccountDto,
    transferRecipientCode: string,
  ): Promise<AccountDocument> {
    const { bankName, accountNumber, accountName } = createAccountDto;

    console.log('userId:', userId);
    console.log('userId type:', typeof userId);
    const account = await new this.accountModel({
      accountName,
      accountNumber,
      bankName,
      userId,
      transferRecipientCode,
    }).save();

    console.log('account:', account);
    return account;
  }

  async getUserAccount(
    userId: Types.ObjectId,
  ): Promise<AccountDocument | null> {
    const userAccount = await this.accountModel.findOne({ userId });

    return userAccount;
  }
  async getUserAccountWithSession(
    userId: Types.ObjectId,
    session: ClientSession,
  ): Promise<AccountDocument | null> {
    const userAccount = await this.accountModel
      .findOne({ userId })
      .session(session);

    return userAccount;
  }

  async getAllAccount(queryWithPaginationDto: QueryWithPaginationDto): Promise<{
    accountObj: AccountDocument[] | null;
    totalPages: number;
    totalCount: number;
  }> {
    const { page, limit, searchParams } = queryWithPaginationDto;

    let query = this.accountModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { bankName: { $regex: regex } },
          { accountName: { $regex: regex } },
          { accountNumber: { $regex: regex } },
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

    const accounts = await query.sort({ createdAt: -1 });

    if (accounts.length === 0) {
      throw new NotFoundException({
        message: 'Accounts not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      accountObj: accounts,
    };

    return response;
  }
}
