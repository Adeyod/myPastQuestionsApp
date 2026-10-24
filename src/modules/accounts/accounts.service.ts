import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { ClientSession, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import { MonnifyService } from '../payments/providers/monnify/monnify.service';
import { PaystackService } from '../payments/providers/paystack/paystack.service';
import { Role } from '../users/schemas/user.schema';
import { CreateAccountDto } from './dtos/create-account.dto';
import { AccountsRepository } from './repositories/account.repository';

@Injectable()
export class AccountsService {
  constructor(
    private accountsRepository: AccountsRepository,
    private readonly paystackService: PaystackService,
    private readonly monnifyService: MonnifyService,
  ) {}

  async createAccount(user: JwtUser, createAccountDto: CreateAccountDto) {
    const { accountName, accountNumber, bankName, bankCode } = createAccountDto;
    const userId = new Types.ObjectId(user.sub);

    const existingAccount =
      await this.accountsRepository.getUserAccount(userId);

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

    const response = await this.accountsRepository.createAccount(
      userId,
      createAccountDto,
      transferRecipientCode,
    );

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

    if (!account) {
      throw new NotFoundException({
        message: 'Account not found.',
        status: 404,
        success: false,
      });
    }

    return account;
  }

  // async resolveAccountFromThirdPartyApi(
  //   accountNumber: string,
  //   bankCode: string,
  // ) {
  //   try {
  //     const paystackResponse =
  //       await this.paystackService.paystackResolveBankAccount(
  //         accountNumber,
  //         bankCode,
  //       );

  //     console.log('paystackResponse.data:', paystackResponse.data);
  //     console.log('paystackResponse.data.data:', paystackResponse.data.data);

  //     return paystackResponse.data.data;
  //   } catch (error) {
  //     console.log('error:', error);
  //     throw error;
  //   }
  // }
  async fetchBankCodes() {
    const paystackResponse = await this.paystackService.paystackBankCodes();

    return paystackResponse.data.data;
  }

  async getAllAccounts(queryWithPaginationDto: QueryWithPaginationDto) {
    return await this.accountsRepository.getAllAccount(queryWithPaginationDto);
  }

  async resolveAccountFromThirdPartyApi(
    accountNumber: string,
    bankCode: string,
  ) {
    try {
      const paystackData = await this.resolveWithPaystack(
        accountNumber,
        bankCode,
      );

      console.log('paystackData response:', paystackData);

      return this.normalizeAccountResponse(paystackData);
    } catch (paystackError: unknown) {
      console.error('Paystack account resolution failed:', {
        message:
          paystackError instanceof Error
            ? paystackError.message
            : 'Unknown error',
        status: this.getHttpStatus(paystackError),
      });

      // Only fall back when the error may be temporary
      // or caused by rate limiting.
      if (!this.shouldFallbackToMonnify(paystackError)) {
        console.log('paystackError error:', paystackError);
        throw paystackError;
      }
    }

    try {
      const monnifyData = await this.monnifyService.validateBankAccount(
        accountNumber,
        bankCode,
      );

      console.log('monnifyData response:', monnifyData);

      return this.normalizeAccountResponse(monnifyData);
    } catch (monnifyError: unknown) {
      console.error('Monnify account resolution failed:', {
        message:
          monnifyError instanceof Error
            ? monnifyError.message
            : 'Unknown error',
        status: this.getHttpStatus(monnifyError),
      });

      throw new ServiceUnavailableException({
        message:
          'We could not verify this bank account right now. Please try again later.',
        success: false,
        status: 503,
      });
    }
  }

  private async resolveWithPaystack(accountNumber: string, bankCode: string) {
    const response = await this.paystackService.paystackResolveBankAccount(
      accountNumber,
      bankCode,
    );

    if (!response.data?.status || !response.data?.data) {
      throw new ServiceUnavailableException(
        'Paystack could not resolve the bank account.',
      );
    }

    return response.data.data;
  }

  private normalizeAccountResponse(data: any) {
    if (
      !data ||
      typeof data.account_name !== 'string' ||
      typeof data.account_number !== 'string'
    ) {
      throw new ServiceUnavailableException(
        'The provider returned an invalid account resolution response.',
      );
    }

    const normalizedData = {
      accountName: data.account_name,
      accountNumber: data.account_number,
      bankCode: data.bank_code ?? data.bankCode,
      bankName: data.bank_name ?? data.bankName,
    };

    console.log('normalizedData response:', normalizedData);

    return normalizedData;
  }

  private getHttpStatus(error: unknown): number | undefined {
    if (error instanceof AxiosError) {
      return error.response?.status;
    }

    return undefined;
  }

  private shouldFallbackToMonnify(error: unknown): boolean {
    if (!(error instanceof AxiosError)) {
      return false;
    }

    const status = error.response?.status;

    return (
      status === 429 ||
      status === 408 ||
      status === 500 ||
      status === 502 ||
      status === 503 ||
      status === 504
    );
  }
}
