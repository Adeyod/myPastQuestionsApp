import { BadRequestException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from '../payments/payments.service';
import { IPaymentProvider } from '../payments/providers/interfaces/provider.interface';
import { PaystackService } from '../payments/providers/paystack/paystack.service';
import { PaymentProvider } from '../payments/schemas/payment.schema';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';

@Injectable()
export class PaymentGatewayService {
  private providerMap: Record<PaymentProvider, IPaymentProvider>;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly withdrawalsService: WithdrawalsService,
    private readonly paystackService: PaystackService,
  ) {
    this.providerMap = {
      [PaymentProvider.PAYSTACK]: this.paystackService,
      // [PaymentProvider.FLUTTERWAVE]: this.flutterwaveService
    };
  }

  async handleWebhook(provider: PaymentProvider, req: Request) {
    console.log('req:', req);
    console.log('provider:', provider);
    const handler = this.providerMap[provider];

    if (!handler) {
      throw new BadRequestException({
        message: 'Unsupported provider.',
        success: false,
        status: 400,
      });
    }

    const providerResponse = await handler.handleWebhook(req);

    const event = providerResponse.event;
    console.log('event:', event);

    switch (event) {
      case 'charge.success':
        return this.paymentsService.handlePaymentWebhook(providerResponse);

      case 'transfer.success':
        return this.withdrawalsService.handleWithdrawalSuccess(
          providerResponse,
        );

      case 'transfer.failed':
        return this.withdrawalsService.handleWithdrawalFailed(providerResponse);

      default:
        return { message: 'Unhandled event type' };
    }
  }
}
