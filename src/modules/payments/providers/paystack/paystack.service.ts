import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import crypto from 'crypto';
import { Request } from 'express';
import { UsersRepository } from '../../../../modules/users/repositories/users.repository';
import { WalletsRepository } from '../../../../modules/wallets/repositories/wallets.repository';
import { PaymentsRepository } from '../../repositories/payment.repository';
import { WebhookProcessionTransactionType } from '../../schemas/payment.schema';
import {
  IPaymentProvider,
  PaymentInitializationPayload,
} from '../interfaces/provider.interface';

@Injectable()
export class PaystackService implements IPaymentProvider {
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secret = process.env.PAYSTACK_TEST_SECRET_KEY;
  constructor(
    private paymentsRepository: PaymentsRepository,
    private usersRepository: UsersRepository,
    private walletsRepository: WalletsRepository,
    private configService: ConfigService,
  ) {
    this.secret = this.configService.get<string>('PAYSTACK_TEST_SECRET_KEY');
  }

  async initializePayment(payload: PaymentInitializationPayload) {
    const { amount, userId, email, ref } = payload;

    const dataToSend = {
      email: email,
      amount,
      metadata: payload,
    };
    const response = await axios.post(
      `${this.baseUrl}/transaction/initialize`,
      dataToSend,
      {
        headers: {
          Authorization: `Bearer ${this.secret}`,
        },
      },
    );

    return {
      provider: 'paystack',
      reference: payload.ref,
      providerReference: response.data.data.reference,
      paymentUrl: response.data.data.authorization_url,
    };
  }

  async verifyPayment(reference: string): Promise<any> {
    const response = await axios.get(
      `${this.baseUrl}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${this.secret as string}`,
        },
      },
    );

    return response.data.data;
  }

  async createTransferRecipient(payload: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  }) {
    const response = await axios.post(
      `${this.baseUrl}/transferrecipient`,
      {
        type: 'nuban',
        name: payload.accountName,
        account_number: payload.accountNumber,
        bank_code: payload.bankCode,
        currency: 'NGN',
      },
      {
        headers: {
          Authorization: `Bearer ${this.secret}`,
        },
      },
    );

    console.log('response:', response);
    console.log('response.data.data:', response.data.data);
    console.log(
      'response.data.data.recipient_code:',
      response.data.data.recipient_code,
    );

    return response.data.data.recipient_code;
  }

  async creditUserBankAccount(payload: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    recipientCode: string;
    amount: number;
    walletId: string;
    reference: string;
    type: WebhookProcessionTransactionType;
  }) {
    const {
      accountNumber,
      accountName,
      recipientCode,
      amount,
      walletId,
      reference,
      type,
    } = payload;

    // 2. Convert to kobo
    const amountInKobo = amount;

    // 5. Initiate transfer
    const response = await axios.post(
      `${this.baseUrl}/transfer`,
      {
        source: 'balance',
        amount: amountInKobo,
        recipient: recipientCode,
        reason: 'User withdrawal',
        reference,
        accountNumber,
        accountName,
        walletId,
        type,
      },
      {
        headers: {
          Authorization: `Bearer ${this.secret}`,
        },
      },
    );

    console.log('response:', response);
    console.log('response.data:', response.data);
    console.log('response.data.data:', response.data.data);

    return response.data.data;
  }

  async paystackResolveBankAccount(accountNumber: string, bankCode: string) {
    const url = `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
    const headers = { Authorization: `Bearer ${this.secret}` };

    const response = await axios(url, { headers });

    console.log('response:', response);
    return response;
  }

  async paystackBankCodes() {
    const url = `${this.baseUrl}/bank`;
    const headers = { Authorization: `Bearer ${this.secret}` };

    const response = await axios(url, { headers });

    console.log('response:', response);
    return response;
  }

  handleWebhook(req: Request): Promise<any> {
    const hash = crypto
      .createHmac('sha512', this.secret as string)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      throw new UnauthorizedException({
        message: 'Invalid signature.',
        success: false,
        status: 401,
      });
    }

    const event = req.body;
    return event;
  }
}
