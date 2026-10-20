import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyWalletModule } from '../company-wallet/company-wallet.module';
import { PaymentsModule } from '../payments/payments.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { UsersModule } from '../users/users.module';
import { WalletsRepository } from './repositories/wallets.repository';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    UserSessionModule,
    UsersModule,
    CompanyWalletModule,
    forwardRef(() => PaymentsModule),
    forwardRef(() => TransactionsModule),
  ],
  controllers: [WalletsController],
  providers: [WalletsService, WalletsRepository],
  exports: [WalletsRepository, WalletsService],
})
export class WalletsModule {}
