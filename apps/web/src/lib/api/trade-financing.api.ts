import { apiClient } from "../api-client";

export interface TradeFinancingEligibilityResponse {
  eligible: boolean;
  maxAmount: string; // BigInt as string from JSON
  interestRate: number;
  creditScore?: string;
  reason?: string;
}

export async function checkTradeFinancingEligibility(): Promise<TradeFinancingEligibilityResponse> {
  return apiClient.get("/trade-financing/eligibility");
}

export async function applyForTradeFinancing(data: {
  orderId: string;
  tenureDays: number;
}): Promise<any> {
  return apiClient.post("/trade-financing/apply", data);
}

export async function getTradeFinancingLoans(): Promise<any[]> {
  return apiClient.get("/trade-financing/loans");
}
