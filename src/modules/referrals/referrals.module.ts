import { forwardRef, Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
  imports: [
    WalletsModule,
    UsersModule,
    TransactionsModule,
    UserSessionModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
