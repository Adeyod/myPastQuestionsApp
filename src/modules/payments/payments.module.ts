import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlansModule } from '../plans/plans.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaystackService } from './providers/paystack/paystack.service';
import { PaymentsRepository } from './repositories/payment.repository';
import { Payment, PaymentSchema } from './schemas/payment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    UsersModule,
    WalletsModule,
    UserSessionModule,
    PlansModule,
    forwardRef(() => ReferralsModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, PaystackService],
  exports: [PaymentsService, PaymentsRepository, PaystackService],
})
export class PaymentsModule {}
