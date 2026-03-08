import { BnplPartnerClient, BuyerCreditData } from "./bnpl-partner.interface";
import { Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class MockBnplClient implements BnplPartnerClient {
  private readonly logger = new Logger(MockBnplClient.name);

  // Hardcode rules for the mock partner
  private readonly MIN_ORDERS = 5;
  private readonly MIN_SPEND = BigInt(5000000); // 50k Naira
  private readonly DEFAULT_INTEREST_RATE = 5.0; // 5% flat

  async checkEligibility(buyerData: BuyerCreditData) {
    this.logger.debug(`Mock eligibility check for ${buyerData.userId}`);

    if (buyerData.completedOrders < this.MIN_ORDERS) {
      return {
        eligible: false,
        maxAmount: BigInt(0),
        interestRate: 0,
        reason: `Need at least ${this.MIN_ORDERS} completed orders.`,
      };
    }

    if (buyerData.totalSpendKobo < this.MIN_SPEND) {
      return {
        eligible: false,
        maxAmount: BigInt(0),
        interestRate: 0,
        reason: "Need higher historical spend.",
      };
    }

    if (buyerData.disputeRate > 0.1) {
      return {
        eligible: false,
        maxAmount: BigInt(0),
        interestRate: 0,
        reason: "Dispute rate too high.",
      };
    }

    // Give them half of their historic spend as a credit limit
    const maxAmount = buyerData.totalSpendKobo / BigInt(2);

    return {
      eligible: true,
      maxAmount,
      interestRate: this.DEFAULT_INTEREST_RATE,
      reason: "Approved based on trading history.",
    };
  }

  async initiateLoan(
    orderId: string,
    amount: bigint,
    tenure: number,
    buyerData: BuyerCreditData,
  ) {
    this.logger.debug(`Mock loan initiated for order ${orderId}`);

    // The mock client always approves an initiated loan request assuming eligibility passed earlier
    const mockLoanRef = `MOCK-LOAN-${uuidv4().substring(0, 8).toUpperCase()}`;
    const mockDisbRef = `MOCK-DSB-${Date.now()}`;

    // Note: In a real integration, this is where the partner transfers funds to our Paystack account.
    // For the mock, we just say it happened.

    return {
      approved: true,
      loanRef: mockLoanRef,
      disbursementRef: mockDisbRef,
    };
  }

  async getLoanStatus(loanRef: string) {
    // 50% paid artificially for testing purposes
    this.logger.debug(`Mock getLoanStatus called for ${loanRef}`);

    return {
      status: "ACTIVE" as const,
      repaid: BigInt(50000),
      remaining: BigInt(50000),
    };
  }
}
