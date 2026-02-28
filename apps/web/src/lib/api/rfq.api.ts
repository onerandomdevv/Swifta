import { apiClient } from '../api-client';
import type { CreateRFQDto, RFQ } from '@hardware-os/shared';

export async function createRFQ(dto: CreateRFQDto): Promise<RFQ> {
  return apiClient.post('/rfqs', dto);
}

export async function getMyRFQs(page = 1, limit = 20): Promise<RFQ[]> {
  return apiClient.get(`/rfqs?page=${page}&limit=${limit}`);
}

export async function getMerchantRFQs(page = 1, limit = 20): Promise<RFQ[]> {
  return apiClient.get(`/rfqs/merchant?page=${page}&limit=${limit}`);
}

export async function getRFQ(id: string): Promise<RFQ> {
  return apiClient.get(`/rfqs/${id}`);
}

export async function cancelRFQ(id: string): Promise<void> {
  return apiClient.post(`/rfqs/${id}/cancel`);
}

export async function updateRFQ(id: string, dto: Partial<CreateRFQDto>): Promise<RFQ> {
  return apiClient.patch(`/rfqs/${id}`, dto);
}

export async function deleteRFQ(id: string): Promise<void> {
  return apiClient.delete(`/rfqs/${id}`);
}
