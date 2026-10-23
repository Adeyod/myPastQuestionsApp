import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import {
  PaymentProvider,
  WebhookProcessionTransactionType,
} from '../../schemas/payment.schema';
import {
  IPaymentProvider,
  MonnifyReturnResponse,
  MonnifyWebhookPayload,
  PaymentInitializationPayload,
  PaymentProviderResponse,
} from '../interfaces/provider.interface';
import { MonnifyDisbursementError } from './monnify-disbursement-error';

@Injectable()
export class MonnifyService implements IPaymentProvider {
  private token?: string;
  private tokenExpiresAt = 0;
  private readonly contractCode: string;
  private readonly redirectUrl: string;
  private readonly sourceAccountNumber: string;

  private readonly baseUrl: string;
  private readonly secret: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('MONNIFY_API_KEY');
    this.baseUrl = this.configService.getOrThrow<string>('MONNIFY_BASE_URL');
    this.secret = this.configService.getOrThrow<string>(
      'MONNIFY_TEST_SECRET_KEY',
    );
    this.contractCode = this.configService.getOrThrow<string>(
      'MONNIFY_CONTRACT_CODE',
    );
    this.redirectUrl = this.configService.getOrThrow<string>(
      'MONNIFY_REDIRECT_URL',
    );
    this.sourceAccountNumber = this.configService.getOrThrow<string>(
      'MONNIFY_SOURCE_ACCOUNT_NUMBER',
    );
  }

  async getAccessToken() {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    const credentials = Buffer.from(`${this.apiKey}:${this.secret}`).toString(
      'base64',
    );

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/auth/login`,
        {},
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        },
      );

      if (
        response.data.requestSuccessful ||
        response.data.responseBody.accessToken
      ) {
        this.token = response.data.responseBody.accessToken;

        const expiresIn = Number(response.data.responseBody.expiresIn ?? 3600);
        this.tokenExpiresAt = Date.now() + Math.max(expiresIn - 60, 60) * 1000;

        return this.token;
      } else {
        throw new BadRequestException({
          message: 'Unable to get access token from monnify.',
          success: false,
          status: 400,
        });
      }
    } catch (error) {
      console.log(error);
      this.token = undefined;
      this.tokenExpiresAt = 0;
      throw new InternalServerErrorException({
        message: 'Unable to authenticate with payment provider.',
        success: false,
        status: 500,
      });
    }
  }
  async initializePayment(
    payload: PaymentInitializationPayload,
  ): Promise<PaymentProviderResponse> {
    const token = await this.getAccessToken();

    const {
      amount,
      email,
      ref,
      paymentDescription,
      currencyCode,
      userId,
      userName,
    } = payload;

    const metaObj = {
      name: userName,
      code: userId,
    };

    const response = await axios.post(
      `${this.baseUrl}/api/v1/merchant/transactions/init-transaction`,
      {
        amount: amount / 100,
        customerEmail: email,
        customerName: userName,
        paymentReference: ref,
        paymentDescription: paymentDescription,
        currencyCode: currencyCode,
        contractCode: this.contractCode,
        redirectUrl: this.redirectUrl,
        metadata: metaObj,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const data: MonnifyReturnResponse = response.data;

    if (!data.requestSuccessful || !data.responseBody?.checkoutUrl) {
      throw new InternalServerErrorException({
        message: 'Unable to intialize checkout',
        success: false,
        status: 500,
      });
    }

    const returnRes = {
      paymentUrl: data.responseBody.checkoutUrl,
      reference: data.responseBody.paymentReference,
      provider: PaymentProvider.MONNIFY,
      providerReference: data.responseBody.transactionReference,
    };

    return returnRes;
  }

  async verifyTransaction(paymentReference: string) {
    const token = await this.getAccessToken();

    const uri = new URL('/api/v2/merchant/transactions/query', this.baseUrl);

    uri.searchParams.set('paymentReference', paymentReference);

    const response = await axios.get(uri.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.data.requestSuccessful || !response.data.responseBody) {
      throw new InternalServerErrorException({
        message: 'Unable to verify payment.',
        success: false,
        status: 500,
      });
    }

    return response.data.responseBody;
  }

  verifyWebhookSignature(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): boolean {
    if (!rawBody || !signature || !/^[a-f0-9]{128}$/i.test(signature)) {
      return false;
    }

    const expected = createHmac('sha512', this.secret).update(rawBody).digest();

    const received = Buffer.from(signature, 'hex');

    return (
      received.length === expected.length && timingSafeEqual(received, expected)
    );
  }

  handleTransactionWebhook(req: Request): Promise<MonnifyWebhookPayload> {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

    const signature = req.headers['monnify-signature'];

    if (typeof signature !== 'string') {
      throw new BadRequestException({
        message: 'Missing Monnify webhook signature',
        success: false,
        status: 400,
      });
    }

    if (!this.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException({
        message: 'Invalid Monnify webhook signature.',
        success: false,
        status: 400,
      });
    }

    const payload = req.body as MonnifyWebhookPayload;

    if (
      !payload ||
      typeof payload.eventType !== 'string' ||
      !payload.eventData
    ) {
      throw new BadRequestException({
        message: 'Invalid Monnify webhook payload.',
        success: false,
        status: 400,
      });
    }

    return Promise.resolve(payload);
  }

  handleDisbursementWebhook(req: Request): Promise<MonnifyWebhookPayload> {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

    const signature = req.headers['monnify-signature'];

    if (typeof signature !== 'string') {
      throw new BadRequestException({
        message: 'Missing Monnify disbursement webhook signature.',
        success: false,
        status: 400,
      });
    }

    if (!this.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException({
        message: 'Invalid Monnify disbursement webhook signature.',
        success: false,
        status: 400,
      });
    }

    const payload = req.body as MonnifyWebhookPayload;

    if (
      !payload ||
      typeof payload.eventType !== 'string' ||
      !payload.eventData ||
      typeof payload.eventData !== 'object'
    ) {
      throw new BadRequestException({
        message: 'Invalid Monnify disbursement webhook payload.',
        success: false,
        status: 400,
      });
    }

    const supportedEvents = [
      'SUCCESSFUL_DISBURSEMENT',
      'FAILED_DISBURSEMENT',
      'REVERSED_DISBURSEMENT',
    ];

    if (!supportedEvents.includes(payload.eventType)) {
      throw new BadRequestException({
        message: 'Unsupported Monnify disbursement event type.',
        success: false,
        status: 400,
      });
    }

    return Promise.resolve(payload);
  }

  async creditUserBankAccount(payload: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    amountInKobo: number;
    reference: string;
    walletId: string;
    type: WebhookProcessionTransactionType;
  }) {
    const {
      bankCode,
      bankName,
      accountNumber,
      accountName,
      amountInKobo,
      reference,
      walletId,
      type,
    } = payload;

    if (!Number.isFinite(amountInKobo) || amountInKobo <= 0) {
      throw new BadRequestException({
        message: 'Invalid withdrawal amount.',
        success: false,
        status: 400,
      });
    }

    const amountInNaira = amountInKobo / 100;
    const token = await this.getAccessToken();

    const transferDetails = {
      amount: amountInNaira,
      reference,
      narration: 'User withdrawal',
      destinationBankCode: bankCode,
      destinationAccountNumber: accountNumber,
      destinationAccountName: accountName,
      currency: 'NGN',
      sourceAccountNumber: this.sourceAccountNumber,
      metadata: {
        accountNumber,
        accountName,
        amountInNaira,
      },
      async: true,
    };

    let response;

    try {
      response = await axios.post(
        `${this.baseUrl}/api/v2/disbursements/single`,
        transferDetails,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-type': 'application/json',
          },
          timeout: 30000,
        },
      );
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const responseData = error.response?.data;

        const isReferenceLengthRejection =
          status === 400 &&
          typeof responseData?.responseMessage === 'string' &&
          responseData.responseMessage
            .toLowerCase()
            .includes('reference size can not be more than 64');

        throw new MonnifyDisbursementError(
          isReferenceLengthRejection
            ? 'Monnify rejected the withdrawal reference.'
            : 'The outcome of the Monnify disbursement is uncertain.',
          isReferenceLengthRejection ? 'REJECTED' : 'UNKNOWN',
          status,
          responseData,
        );
      }

      throw new MonnifyDisbursementError(
        'The outcome of the Monnify disbursement is uncertain.',
        'UNKNOWN',
      );
    }

    const data = response.data;

    if (!data.requestSuccessful || !data.responseBody) {
      console.error('Monnify returned an unsuccessful response:', {
        responseCode: data.responseCode,
        responseMessage: data.responseMessage,
        reference,
      });

      throw new MonnifyDisbursementError(
        data.responseMessage ?? 'Monnify returned an unsuccessful response.',
        'UNKNOWN',
        response.status,
        data,
      );
    }

    return data.responseBody;
  }

  async getTransferStatus(reference: string) {
    const token = await this.getAccessToken();

    const uri = new URL('api/v2/disbursements/single/summary', this.baseUrl);

    uri.searchParams.set('reference', reference);

    const response = await axios.get(uri.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    });

    if (!response.data.requestSuccessful || !response.data.responseBody) {
      throw new InternalServerErrorException({
        message: 'Unable to retrieve transfer status from Monnify.',
        success: false,
        status: 500,
      });
    }

    return response.data.responseBody;
  }
}
