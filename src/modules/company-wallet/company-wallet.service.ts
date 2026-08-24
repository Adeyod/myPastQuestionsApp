import { BadRequestException, Injectable } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { CompanyWalletRepository } from './repositories/company-wallet.repository';

@Injectable()
export class CompanyWalletService {
  constructor(
    private readonly companyWalletRepository: CompanyWalletRepository,
  ) {}

  async getOrCreateCompanyWallet(session: ClientSession) {
    const existingWallet = await this.companyWalletRepository.findByName(
      'MAIN',
      session,
    );

    if (existingWallet) {
      return existingWallet;
    }

    return await this.companyWalletRepository.createWallet(
      {
        name: 'MAIN',
        balanceInKobo: 0,
        totalRevenueInKobo: 0,
        totalWithdrawnInKobo: 0,
      },
      session,
    );
  }

  async creditWallet(amountInKobo: number, session: ClientSession) {
    const response = await this.companyWalletRepository.creditWallet(
      'MAIN',
      amountInKobo,
      session,
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to credit company wallet.',
        success: false,
        status: 400,
      });
    }

    return response;
  }
}
