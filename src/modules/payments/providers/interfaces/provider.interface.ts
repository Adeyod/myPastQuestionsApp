import { Request } from 'express';
import { WebhookProcessionTransactionType } from '../../schemas/payment.schema';

export interface PaymentInitializationPayload {
  email: string;
  amount: number;
  ref: string;
  // reference: string;
  userId: string;
  type: WebhookProcessionTransactionType;
}

export interface PaymentProviderResponse {
  paymentUrl: string;
  reference: string;
  provider: string;
  providerReference: string;
}

export interface IPaymentProvider {
  initializePayment(
    payload: PaymentInitializationPayload,
  ): Promise<PaymentProviderResponse>;

  verifyPayment(reference: string): Promise<any>;

  handleWebhook(req: Request): Promise<any>;
}
