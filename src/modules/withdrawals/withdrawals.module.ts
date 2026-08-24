import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsModule } from '../accounts/accounts.module';
import { PaymentsModule } from '../payments/payments.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { WalletsModule } from '../wallets/wallets.module';
import { WithdrawalsRepository } from './repositories/withdrawals.repository';
import { Withdrawal, WithdrawalSchema } from './schemas/withdrawal.schema';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Withdrawal.name, schema: WithdrawalSchema },
    ]),
    UserSessionModule,
    PaymentsModule,
    WalletsModule,
    TransactionsModule,
    AccountsModule,
  ],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService, WithdrawalsRepository],
  exports: [WithdrawalsService, WithdrawalsRepository],
})
export class WithdrawalsModule {}
