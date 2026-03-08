import {
  TradeFinancingPartnerClient,
  MerchantCreditData,
} from "./trade-financing-partner.interface";
import { Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class MockTradeFinancingClient implements TradeFinancingPartnerClient {
  private readonly logger = new Logger(MockTradeFinancingClient.name);

  // Hardcode rules for the mock partner for merchants
  private readonly MIN_SALES = 10;
  private readonly MIN_MONTHLY_REV = BigInt(50000000); // ₦500k
  private readonly DEFAULT_INTEREST_RATE = 4.5; // 4.5% flat for B2B

  async checkEligibility(merchantData: MerchantCreditData) {
    this.logger.debug(
      `Mock eligibility check for merchant ${merchantData.merchantId}`,
    );

    if (merchantData.completedSales < this.MIN_SALES) {
      return {
        eligible: false,
        maxAmount: 0n,
        interestRate: 0,
        reason: `Need at least ${this.MIN_SALES} completed sales orders.`,
      };
    }

    if (merchantData.averageMonthlyRevenueKobo < this.MIN_MONTHLY_REV) {
      return {
        eligible: false,
        maxAmount: 0n,
        interestRate: 0,
        reason: "Monthly revenue is below financing threshold.",
      };
    }

    // Give them 3x their monthly revenue as a credit limit
    const maxAmount = merchantData.averageMonthlyRevenueKobo * 3n;
    const creditScore =
      merchantData.averageMonthlyRevenueKobo > 100000000n ? "A+" : "B";

    return {
      eligible: true,
      maxAmount,
      interestRate: this.DEFAULT_INTEREST_RATE,
      creditScore,
      reason: "Approved based on merchant revenue history.",
    };
  }

  async initiateLoan(
    orderId: string,
    amount: bigint,
    tenure: number,
    merchantData: MerchantCreditData,
  ) {
    this.logger.debug(`Mock trade financing initiated for order ${orderId}`);

    const mockLoanRef = `TF-${uuidv4().substring(0, 8).toUpperCase()}`;
    const mockDisbRef = `TF-DSB-${Date.now()}`;

    return {
      approved: true,
      loanRef: mockLoanRef,
      disbursementRef: mockDisbRef,
    };
  }

  async getLoanStatus(loanRef: string) {
    this.logger.debug(`Mock getLoanStatus called for ${loanRef}`);

    return {
      status: "ACTIVE" as const,
      repaid: 0n,
      remaining: 10000000n, // Dummy remaining
    };
  }
}
