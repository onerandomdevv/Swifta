import { apiClient } from '../api-client';
import type { InitializePaymentDto, Payment } from '@hardware-os/shared';

export async function initializePayment(dto: InitializePaymentDto): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  return apiClient.post('/payments/initialize', dto);
}

export async function getNigerianBanks(): Promise<{ name: string; code: string }[]> {
  const response = await fetch('https://api.paystack.co/bank?country=nigeria');
  if (!response.ok) throw new Error('Failed to fetch banks');
  const result = await response.json();
  return result.data;
}
