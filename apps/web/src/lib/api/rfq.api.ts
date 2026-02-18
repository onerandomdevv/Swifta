import { apiClient } from '../api-client';
import type { CreateRFQDto, ApiResponse, RFQ } from '@hardware-os/shared';

export async function createRFQ(dto: CreateRFQDto): Promise<ApiResponse<RFQ>> {
  return apiClient.post('/rfqs', dto);
}

export async function getMyRFQs(page = 1, limit = 20): Promise<ApiResponse<RFQ[]>> {
  return apiClient.get(`/rfqs?page=${page}&limit=${limit}`);
}

export async function getMerchantRFQs(page = 1, limit = 20): Promise<ApiResponse<RFQ[]>> {
  return apiClient.get(`/rfqs/merchant?page=${page}&limit=${limit}`);
}

export async function getRFQ(id: string): Promise<ApiResponse<RFQ>> {
  return apiClient.get(`/rfqs/${id}`);
}

export async function cancelRFQ(id: string): Promise<ApiResponse<void>> {
  return apiClient.post(`/rfqs/${id}/cancel`);
}
