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
    console.log('I want to process webhook here... Service function');
    const handler = this.providerMap[provider];

    console.log('handler in service file:', handler);

    if (!handler) {
      throw new BadRequestException({
        message: 'Unsupported provider.',
        success: false,
        status: 400,
      });
    }

    const providerResponse = await handler.handleWebhook(req);

    console.log('providerResponse in service file:', providerResponse);
    if (provider === PaymentProvider.MONNIFY) {
      const { eventType, eventData } = providerResponse;

      console.log('eventType in service file:', eventType);
      console.log('eventData in service file:', eventData);
      if (
        eventType === 'SUCCESSFUL_TRANSACTION' &&
        eventData?.paymentStatus === 'PAID'
      ) {
        console.log('This monnify condition is met.....');
        const paymentRef = eventData.paymentReference;
        const userId = paymentRef.split('_')[3];

        console.log(
          'userID from splitting payment reference in monnify:',
          userId,
        );

        return this.paymentsService.handlePaymentWebhook(
          PaymentProvider.MONNIFY,
          userId,
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
