export interface BuyerCreditData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  completedOrders: number;
  totalSpendKobo: bigint;
  disputeRate: number;
}

export interface BnplPartnerClient {
  /**
   * Evaluates the buyer's creditworthiness based on SwiftTrade history + partner logic
   */
  checkEligibility(
    buyerData: BuyerCreditData,
  ): Promise<{
    eligible: boolean;
    maxAmount: bigint;
    interestRate: number;
    reason?: string;
  }>;

  /**
   * Books the loan with the partner. If approved, the partner will disburse funds to SwiftTrade.
   */
  initiateLoan(
    orderId: string,
    amount: bigint,
    tenure: number,
    buyerData: BuyerCreditData,
  ): Promise<{ approved: boolean; loanRef: string; disbursementRef: string }>;

  /**
   * Fetches the latest repayment status for an active loan
   */
  getLoanStatus(
    loanRef: string,
  ): Promise<{
    status: "ACTIVE" | "REPAID" | "DEFAULTED";
    repaid: bigint;
    remaining: bigint;
  }>;
}
