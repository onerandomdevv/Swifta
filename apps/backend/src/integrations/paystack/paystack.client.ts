import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

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

export interface PaystackResolveResponse {
  account_number: string;
  account_name: string;
  bank_id: number;
}

export interface PaystackBank {
  name: string;
  code: string;
  active: boolean;
  type: string;
}

@Injectable()
export class PaystackClient {
  private readonly logger = new Logger(PaystackClient.name);
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>(
      "paystack.baseUrl",
      "https://api.paystack.co",
    );
    this.secretKey = this.config.get<string>("paystack.secretKey", "");
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Create a Paystack customer (required before DVA)
   */
  async createCustomer(params: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/customer`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        email: params.email,
        first_name: params.firstName,
        last_name: params.lastName,
        phone: params.phone,
      }),
    });
    return response.json();
  }

  /**
   * Create a Dedicated Virtual Account for a customer
   * Auto-detects test mode and uses 'test-bank' accordingly
   */
  async createDedicatedVirtualAccount(customerCode: string): Promise<any> {
    const isTestMode = this.secretKey.startsWith("sk_test_");
    const response = await fetch(`${this.baseUrl}/dedicated_account`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        customer: customerCode,
        preferred_bank: isTestMode ? "test-bank" : "wema-bank",
      }),
    });
    return response.json();
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
    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        email,
        amount: Number(amountKobo),
        reference,
        callback_url: callbackUrl,
      }),
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
        method: "GET",
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
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        type: "nuban",
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
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
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        source: "balance",
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

  // ──────────────────────────────────────────────
  //  RESOLVE ACCOUNT NUMBER
  // ──────────────────────────────────────────────

  async resolveAccount(
    accountNumber: string,
    bankCode: string,
  ): Promise<PaystackResolveResponse> {
    const response = await fetch(
      `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: "GET",
        headers: this.headers,
      },
    );

    const json = await response.json();

    if (!json.status) {
      this.logger.error(
        `Paystack account resolution failed: ${json.message}`,
        json,
      );
      throw new Error(`Account resolution failed: ${json.message}`);
    }

    return json.data as PaystackResolveResponse;
  }

  // ──────────────────────────────────────────────
  //  GET BANKS
  // ──────────────────────────────────────────────

  async getBanks(): Promise<PaystackBank[]> {
    const response = await fetch(`${this.baseUrl}/bank?currency=NGN`, {
      method: "GET",
      headers: this.headers,
    });

    const json = await response.json();

    if (!json.status) {
      this.logger.error(`Paystack get banks failed: ${json.message}`, json);
      throw new Error(`Failed to fetch banks: ${json.message}`);
    }

    return json.data as PaystackBank[];
  }

  async findBankByName(
    bankName: string,
  ): Promise<{ code: string; name: string } | null> {
    const banks = await this.getBanks();
    const lower = bankName.toLowerCase();
    const exactMatch = banks.find((bank) => bank.name.toLowerCase() === lower);
    if (exactMatch) {
      return { code: exactMatch.code, name: exactMatch.name };
    }

    const partialMatches = banks.filter((bank) =>
      bank.name.toLowerCase().includes(lower),
    );

    if (partialMatches.length > 1) {
      this.logger.warn(
        `Ambiguous Paystack bank name "${bankName}" matched: ${partialMatches
          .map((bank) => bank.name)
          .join(", ")}`,
      );
      return null;
    }

    const match = partialMatches[0];
    return match ? { code: match.code, name: match.name } : null;
  }
}
