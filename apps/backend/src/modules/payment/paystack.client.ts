import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaystackClient {
  constructor(private config: ConfigService) {}

  async initializeTransaction(email: string, amountKobo: bigint, reference: string, callbackUrl?: string) {
      // Stub
      return {
          authorization_url: 'https://checkout.paystack.com/stub-url',
          access_code: 'stub-access-code',
          reference
      };
  }

  async verifyTransaction(reference: string) {
      // Stub
      return { status: 'success', amount: 10000, reference };
  }

  async createTransfer(recipientCode: string, amountKobo: bigint, reference: string, reason: string) {
      // Stub
      return { status: 'success', transfer_code: 'TRF_stub' };
  }
}
