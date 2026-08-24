import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { ExamType } from '../../common/enums/exam-type.enum';
import { JwtUser } from '../../common/types/jwt-user.type';
import { CompanyWalletService } from '../company-wallet/company-wallet.service';
import { Role } from '../users/schemas/user.schema';
import { WalletsRepository } from './repositories/wallets.repository';

@Injectable()
export class WalletsService {
  constructor(
    private readonly walletsRepository: WalletsRepository,
    private readonly companyWalletService: CompanyWalletService,
  ) {}

  async chargeForPracticeQuestions(data: {
    userWalletId: string;
    amountInKobo: number;
    questionCount: number;
    examType: ExamType;
    subjectId: string;
    session: ClientSession;
  }) {
    const payload = {
      walletId: data.userWalletId,
      amountInKobo: data.amountInKobo,
      description: `Charges for ${data.questionCount} practice questions.`,
    };
    const debitWallet = await this.walletsRepository.chargeWallet(payload);

    console.log('debitWallet:', debitWallet);

    const companyWallet =
      await this.companyWalletService.getOrCreateCompanyWallet(data.session);
    console.log('companyWallet:', companyWallet);

    const creditCompanyWallet = await this.companyWalletService.creditWallet(
      data.amountInKobo,
      data.session,
    );
    console.log('creditCompanyWallet:', creditCompanyWallet);

    return debitWallet;
  }
  async findWalletByUserId(userId: string, user: JwtUser) {
    if (user.role !== Role.ADMIN) {
      if (user.sub.toString() !== userId) {
        throw new ForbiddenException({
          message: 'You can only have access to your own wallet.',
          success: false,
          status: 403,
        });
      }
    }

    const wallet = await this.walletsRepository.findWalletByUserId(userId);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found.',
        status: 404,
        success: false,
      });
    }

    return wallet;
  }

  async findWalletById(walletId: string, user: JwtUser) {
    const wallet = await this.walletsRepository.findWalletById(walletId);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found.',
        status: 404,
        success: false,
      });
    }

    if (user.role !== Role.ADMIN) {
      if (user.sub.toString() !== wallet.userId.toString()) {
        throw new ForbiddenException({
          message: 'You can only have access to your own wallet.',
          success: false,
          status: 403,
        });
      }
    }

    return wallet;
  }

  async getWalletBalance(walletId: string, user: JwtUser) {
    const wallet = await this.walletsRepository.findWalletById(walletId);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found.',
        status: 404,
        success: false,
      });
    }

    if (user.role !== Role.ADMIN) {
      if (user.sub.toString() !== wallet.userId.toString()) {
        throw new ForbiddenException({
          message: 'You can only have access to your own wallet.',
          success: false,
          status: 403,
        });
      }
    }

    return wallet.balanceInKobo;
  }
}
