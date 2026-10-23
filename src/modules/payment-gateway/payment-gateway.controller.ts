import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  type RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentProvider } from '../payments/schemas/payment.schema';
import { PaymentGatewayService } from './payment-gateway.service';

@Controller('payment-gateway')
export class PaymentGatewayController {
  constructor(private readonly paymentGatewayService: PaymentGatewayService) {}
  @Post('transaction-webhook/:provider')
  @HttpCode(HttpStatus.OK)
  async handleTransactionWebhook(
    @Param('provider') provider: PaymentProvider,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return await this.paymentGatewayService.handleTransactionWebhook(
      provider,
      req,
    );
  }
  @Post('disbursement-webhook/:provider')
  @HttpCode(HttpStatus.OK)
  async handleDisbursementWebhook(
    @Param('provider') provider: PaymentProvider,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return await this.paymentGatewayService.handleDisbursementWebhook(
      provider,
      req,
    );
  }
}
