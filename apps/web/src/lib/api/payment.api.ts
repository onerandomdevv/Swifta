import { apiClient } from '../api-client';
import type { InitializePaymentDto, Payment } from '@swifta/shared';

export async function initializePayment(dto: InitializePaymentDto): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  return apiClient.post('/payments/initialize', dto);
}

export async function getNigerianBanks(): Promise<{ name: string; code: string }[]> {
  const response = await fetch('https://api.paystack.co/bank?country=nigeria');
  if (!response.ok) throw new Error('Failed to fetch banks');
  const result = await response.json();
  return result.data;
}

export async function resolveBankAccount(accountNumber: string, bankCode: string): Promise<{ account_name: string; account_number: string; bank_id: number; }> {
  return apiClient.get(`/payments/resolve-account?accountNumber=${accountNumber}&bankCode=${bankCode}`);
}

export async function verifyPayment(reference: string): Promise<{ status: string; paymentId: string }> {
  return apiClient.get(`/payments/verify/${reference}`);
}
