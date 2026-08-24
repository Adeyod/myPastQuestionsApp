// import { Injectable } from '@nestjs/common';
// import {
//   IPaymentProvider,
//   PaymentInitializationPayload,
//   PaymentProviderResponse,
// } from '../interfaces/provider.interface';
// import axios from 'axios';

// @Injectable()
// export class flutterwaveService implements IPaymentProvider {
//   async initializePayment(
//     payload: PaymentInitializationPayload,
//   ): Promise<PaymentProviderResponse> {

//     const response = await axios.post()
//     return {
//       provider: 'flutterwave',
//       reference: payload.reference,
//       paymentUrl: `https://flutterwave.com/pay/${payload.reference}`,
//     };
//   }

//   async verifyPayment(reference: string): Promise<any> {
//     return { status: 'success' };
//   }
// }
