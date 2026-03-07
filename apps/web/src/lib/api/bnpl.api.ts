import { apiClient } from '../api-client';

export interface BnplEligibilityResponse {
  eligible: boolean;
  maxAmountKobo?: string;
  reason: string;
  ordersNeeded?: number;
}

export interface BnplWaitlistResponse {
  message: string;
}

export async function checkBnplEligibility(): Promise<BnplEligibilityResponse> {
  return apiClient.get('/bnpl/eligibility');
}

export async function joinBnplWaitlist(data?: { phone?: string }): Promise<BnplWaitlistResponse> {
  return apiClient.post('/bnpl/waitlist', data || {});
}
