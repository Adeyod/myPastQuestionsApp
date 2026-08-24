import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';
import { PaymentGatewayController } from './payment-gateway.controller';
import { PaymentGatewayService } from './payment-gateway.service';

@Module({
  imports: [PaymentsModule, WithdrawalsModule],
  controllers: [PaymentGatewayController],
  providers: [PaymentGatewayService],
})
export class PaymentGatewayModule {}
