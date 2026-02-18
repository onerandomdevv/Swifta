import { apiClient } from '../api-client';
import type { InitializePaymentDto, ApiResponse, Payment } from '@hardware-os/shared';

export async function initializePayment(dto: InitializePaymentDto): Promise<ApiResponse<{ authorization_url: string; access_code: string; reference: string }>> {
  return apiClient.post('/payments/initialize', dto);
}
