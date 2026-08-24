import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentProvider } from '../payments/schemas/payment.schema';
import { PaymentGatewayService } from './payment-gateway.service';

@Controller('payment-gateway')
export class PaymentGatewayController {
  constructor(private readonly paymentGatewayService: PaymentGatewayService) {}
  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('provider') provider: PaymentProvider,
    @Req() req: Request,
  ) {
    return await this.paymentGatewayService.handleWebhook(provider, req);
  }
}
