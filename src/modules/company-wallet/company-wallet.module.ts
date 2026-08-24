import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyWalletController } from './company-wallet.controller';
import { CompanyWalletService } from './company-wallet.service';
import { CompanyWalletRepository } from './repositories/company-wallet.repository';
import {
  CompanyTransaction,
  CompanyTransactionSchema,
} from './schemas/company-transaction.schema';
import {
  CompanyWallet,
  CompanyWalletSchema,
} from './schemas/company-wallet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CompanyWallet.name, schema: CompanyWalletSchema },
      { name: CompanyTransaction.name, schema: CompanyTransactionSchema },
    ]),
  ],
  controllers: [CompanyWalletController],
  providers: [CompanyWalletService, CompanyWalletRepository],
  exports: [CompanyWalletService],
})
export class CompanyWalletModule {}
