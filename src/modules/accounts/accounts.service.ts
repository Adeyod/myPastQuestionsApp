import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import { PaystackService } from '../payments/providers/paystack/paystack.service';
import { Role } from '../users/schemas/user.schema';
import { CreateAccountDto } from './dtos/create-account.dto';
import { AccountsRepository } from './repositories/account.repository';

@Injectable()
export class AccountsService {
  constructor(
    private accountsRepository: AccountsRepository,
    private readonly paystackService: PaystackService,
  ) {}

  async createAccount(user: JwtUser, createAccountDto: CreateAccountDto) {
    const { accountName, accountNumber, bankName, bankCode } = createAccountDto;
    const userId = new Types.ObjectId(user.sub);

    const existingAccount =
      await this.accountsRepository.getUserAccount(userId);

    console.log('existingAccount:', existingAccount);
    if (existingAccount) {
      throw new ConflictException({
        message: 'User already has an account.',
        success: false,
        status: 409,
      });
    }

    const transferRecipientCode =
      await this.paystackService.createTransferRecipient({
        accountNumber,
        accountName,
        bankCode,
      });

    console.log('transferRecipientCode:', transferRecipientCode);

    const response = await this.accountsRepository.createAccount(
      userId,
      createAccountDto,
      transferRecipientCode,
    );

    console.log('response:', response);
    return response;
  }

  async getUserAccount(user: JwtUser, userId: string) {
    const { sub, role } = user;

    if (role === Role.USER) {
      if (sub.toString() !== userId) {
        throw new UnauthorizedException({
          message: 'You can only access your personal account.',
          success: false,
          status: 401,
        });
      }
    }

    const id = new Types.ObjectId(userId);
    const account = await this.accountsRepository.getUserAccount(id);
    console.log('account:', account);

    if (!account) {
      throw new NotFoundException({
        message: 'Account not found.',
        status: 404,
        success: false,
      });
    }

    return account;
  }
  async getUserAccountWithSession(
    user: JwtUser,
    userId: string,
    session: ClientSession,
  ) {
    const { sub, role } = user;

    if (role === Role.USER) {
      if (sub.toString() !== userId) {
        throw new UnauthorizedException({
          message: 'You can only access your personal account.',
          success: false,
          status: 401,
        });
      }
    }

    const id = new Types.ObjectId(userId);
    const account = await this.accountsRepository.getUserAccountWithSession(
      id,
      session,
    );
    console.log('account:', account);

    if (!account) {
      throw new NotFoundException({
        message: 'Account not found.',
        status: 404,
        success: false,
      });
    }

    return account;
  }

  async resolveAccountFromThirdPartyApi(
    accountNumber: string,
    bankCode: string,
  ) {
    const paystackResponse =
      await this.paystackService.paystackResolveBankAccount(
        accountNumber,
        bankCode,
      );

    console.log('paystackResponse:', paystackResponse);

    return paystackResponse.data.data;
  }
  async fetchBankCodes() {
    const paystackResponse = await this.paystackService.paystackBankCodes();

    console.log('paystackResponse:', paystackResponse);

    return paystackResponse.data.data;
  }

  async getAllAccounts(queryWithPaginationDto: QueryWithPaginationDto) {
    return await this.accountsRepository.getAllAccount(queryWithPaginationDto);
  }
}
