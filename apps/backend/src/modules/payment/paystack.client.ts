import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackVerifyResponse {
  status: string;
  amount: number;
  reference: string;
  currency: string;
  gateway_response: string;
}

interface PaystackTransferResponse {
  status: string;
  transfer_code: string;
  reference: string;
}

interface PaystackRecipientResponse {
  recipient_code: string;
}

@Injectable()
export class PaystackClient {
  private readonly logger = new Logger(PaystackClient.name);
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('paystack.baseUrl', 'https://api.paystack.co');
    this.secretKey = this.config.get<string>('paystack.secretKey', '');
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  // ──────────────────────────────────────────────
  //  INITIALIZE TRANSACTION
  // ──────────────────────────────────────────────

  async initializeTransaction(
    email: string,
    amountKobo: bigint,
    reference: string,
    callbackUrl?: string,
  ): Promise<PaystackInitResponse> {
    const body: Record<string, any> = {
      email,
      amount: Number(amountKobo),
      reference,
    };
    if (callbackUrl) body.callback_url = callbackUrl;

    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    const json = await response.json();

    if (!json.status) {
      this.logger.error(`Paystack init failed: ${json.message}`, json);
      throw new Error(`Paystack initialization failed: ${json.message}`);
    }

    this.logger.log(`Payment initialized: ${reference}`);
    return json.data as PaystackInitResponse;
  }

  // ──────────────────────────────────────────────
  //  VERIFY TRANSACTION
  // ──────────────────────────────────────────────

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const response = await fetch(
      `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: this.headers,
      },
    );

    const json = await response.json();

    if (!json.status) {
      this.logger.error(`Paystack verify failed: ${json.message}`, json);
      throw new Error(`Paystack verification failed: ${json.message}`);
    }

    return json.data as PaystackVerifyResponse;
  }

  // ──────────────────────────────────────────────
  //  CREATE TRANSFER RECIPIENT
  // ──────────────────────────────────────────────

  async createTransferRecipient(
    bankCode: string,
    accountNumber: string,
    accountName: string,
  ): Promise<PaystackRecipientResponse> {
    const response = await fetch(`${this.baseUrl}/transferrecipient`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    });

    const json = await response.json();

    if (!json.status) {
      this.logger.error(`Paystack recipient failed: ${json.message}`, json);
      throw new Error(`Paystack create recipient failed: ${json.message}`);
    }

    return json.data as PaystackRecipientResponse;
  }

  // ──────────────────────────────────────────────
  //  CREATE TRANSFER (PAYOUT)
  // ──────────────────────────────────────────────

  async createTransfer(
    recipientCode: string,
    amountKobo: bigint,
    reference: string,
    reason: string,
  ): Promise<PaystackTransferResponse> {
    const response = await fetch(`${this.baseUrl}/transfer`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        source: 'balance',
        amount: Number(amountKobo),
        recipient: recipientCode,
        reference,
        reason,
      }),
    });

    const json = await response.json();

    if (!json.status) {
      this.logger.error(`Paystack transfer failed: ${json.message}`, json);
      throw new Error(`Paystack transfer failed: ${json.message}`);
    }

    this.logger.log(`Payout initiated: ${reference}`);
    return json.data as PaystackTransferResponse;
  }
}
