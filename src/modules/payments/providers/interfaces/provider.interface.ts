import { Request } from 'express';
import { WebhookProcessionTransactionType } from '../../schemas/payment.schema';

export interface PaymentInitializationPayload {
  email: string;
  amount: number;
  ref: string;
  userId: string;
  userName: string;
  paymentDescription: string;
  currencyCode: string;
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

  verifyTransaction(reference: string): Promise<any>;

  handleWebhook(req: Request): Promise<any>;
}

export interface ResponseBodyInterface {
  transactionReference: string;
  paymentReference: string;
  merchantName: string;
  apiKey: string;
  enabledPaymentMethod: [string];
  checkoutUrl: string;
  incomingSplitConfig: {
    subAccountCode: string;
    splitAmount: number;
    feePercentage: number;
    feeBearer: boolean;
    splitPercentage: number;
  }[];
}

export interface MonnifyReturnResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: ResponseBodyInterface;
}

export interface MonnifyWebhookPayload {
  eventType: string;
  eventData: {
    paymentReference?: string;
    transactionReference?: string;
    paymentStatus?: string;
    amountPaid?: number | string;
    totalPayable?: number | string;
    currency?: string;
    currencyCode?: string;
    [key: string]: unknown;
  };
}
