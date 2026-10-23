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

  async handleTransactionWebhook(provider: PaymentProvider, req: Request) {
    console.log(
      'I want to process transaction webhook here... Service function',
    );
    const handler = this.providerMap[provider];

    console.log('handler in service file:', handler);

    if (!handler) {
      throw new BadRequestException({
        message: 'Unsupported provider.',
        success: false,
        status: 400,
      });
    }

    const providerResponse = await handler.handleTransactionWebhook(req);

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

        const userId = paymentRef.split('_')[2];

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

  async handleDisbursementWebhook(provider: PaymentProvider, req: Request) {
    console.log(
      'I want to process transaction webhook here... Service function',
    );
    const handler = this.providerMap[provider];

    console.log('handler in service file:', handler);

    if (!handler) {
      throw new BadRequestException({
        message: 'Unsupported provider.',
        success: false,
        status: 400,
      });
    }

    const providerResponse = await handler.handleDisbursementWebhook(req);

    console.log('providerResponse in service file:', providerResponse);
    if (provider === PaymentProvider.MONNIFY) {
      const { eventType, eventData } = providerResponse;

      if (!eventType || !eventData) {
        throw new BadRequestException({
          message: 'Invalid Monnify disbursement payload.',
          success: false,
          status: 400,
        });
      }

      const normalizedResponse = {
        data: {
          reference: eventData.reference,
          transactionReference: eventData.transactionReference,
          status: eventData.status,
          metadata: eventData.metadata ?? {},
        },
      };

      switch (eventType) {
        case 'SUCCESSFUL_DISBURSEMENT':
          return this.withdrawalsService.handleWithdrawalSuccess(
            normalizedResponse,
          );

        case 'FAILED_DISBURSEMENT':
          return this.withdrawalsService.handleWithdrawalFailed(
            normalizedResponse,
          );

        case 'REVERSED_DISBURSEMENT':
          // Do not automatically treat a reversal as an ordinary failure.
          // Implement a dedicated reversal/reconciliation workflow.
          return this.withdrawalsService.handleWithdrawalReversed(
            normalizedResponse,
          );
        // return {
        //   message:
        //     'Monnify reported a reversed disbursement. Reconciliation is required.',
        //   reference: eventData.reference,
        //   providerReference: eventData.transactionReference,
        //   providerStatus: eventData.status,
        // };

        default:
          return {
            message: 'Unhandled Monnify disbursement event.',
            eventType,
          };
      }
    }

    if (provider === PaymentProvider.PAYSTACK) {
      switch (providerResponse.event) {
        case 'transfer.success':
          return this.withdrawalsService.handleWithdrawalSuccess(
            providerResponse,
          );

        case 'transfer.failed':
          return this.withdrawalsService.handleWithdrawalFailed(
            providerResponse,
          );

        default:
          return {
            message: 'Unhandled Paystack disbursement event.',
            event: providerResponse.event,
          };
      }
    }

    return {
      message: 'No disbursement handler is configured for this provider.',
    };
  }
}
