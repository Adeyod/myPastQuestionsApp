import { BadRequestException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from '../payments/payments.service';
import { IPaymentProvider } from '../payments/providers/interfaces/provider.interface';
import { MonnifyService } from '../payments/providers/monnify/monnify.service';
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
    private readonly monnifyService: MonnifyService,
  ) {
    this.providerMap = {
      [PaymentProvider.PAYSTACK]: this.paystackService,
      [PaymentProvider.MONNIFY]: this.monnifyService,
      // [PaymentProvider.FLUTTERWAVE]: this.flutterwaveService
    };
  }

  async handleWebhook(provider: PaymentProvider, req: Request) {
    const handler = this.providerMap[provider];

    if (!handler) {
      throw new BadRequestException({
        message: 'Unsupported provider.',
        success: false,
        status: 400,
      });
    }

    const providerResponse = await handler.handleWebhook(req);

    if (provider === PaymentProvider.MONNIFY) {
      const { eventType, eventData } = providerResponse;

      if (
        eventType === 'SUCCESSFUL_TRANSACTION' &&
        eventData?.paymentStatus === 'PAID'
      ) {
        return this.paymentsService.handlePaymentWebhook(
          PaymentProvider.MONNIFY,
          eventData.metadata.userId,
          eventData.transactionReference,
        );
      }

      return { message: 'Unhandled Monnify event type.' };
    }

    const event = providerResponse.event;

    switch (event) {
      case 'charge.success':
        return this.paymentsService.handlePaymentWebhook(
          PaymentProvider.PAYSTACK,
          providerResponse.data.metadata.userId,
          providerResponse.data.reference,
        );

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
