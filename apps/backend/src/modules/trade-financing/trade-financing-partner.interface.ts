export interface MerchantCreditData {
  userId: string;
  merchantId: string;
  businessName: string;
  email: string;
  phone: string;
  completedSales: number;
  totalRevenueKobo: bigint;
  averageMonthlyRevenueKobo: bigint;
  disputeRate: number;
  verificationTier: string;
}

export interface TradeFinancingPartnerClient {
  /**
   * Evaluates the merchant's creditworthiness based on SwiftTrade sales history + partner logic
   */
  checkEligibility(merchantData: MerchantCreditData): Promise<{
    eligible: boolean;
    maxAmount: bigint;
    interestRate: number;
    reason?: string;
  }>;

  /**
   * Books the trade financing loan with the partner.
   */
  initiateLoan(
    orderId: string,
    amount: bigint,
    tenure: number,
    merchantData: MerchantCreditData,
  ): Promise<{ approved: boolean; loanRef: string; disbursementRef: string }>;

  /**
   * Fetches the latest repayment status for an active loan
   */
  getLoanStatus(loanRef: string): Promise<{
    status: "ACTIVE" | "REPAID" | "DEFAULTED";
    repaid: bigint;
    remaining: bigint;
  }>;
}
