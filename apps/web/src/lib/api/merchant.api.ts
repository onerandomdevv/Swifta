import { apiClient } from '../api-client';
import type { UpdateMerchantDto, ApiResponse, MerchantProfile } from '@hardware-os/shared';

export async function getProfile(): Promise<ApiResponse<MerchantProfile>> {
  return apiClient.get('/merchants/me');
}

export async function updateProfile(dto: UpdateMerchantDto): Promise<ApiResponse<MerchantProfile>> {
  return apiClient.patch('/merchants/me', dto);
}

export async function getPublicProfile(id: string): Promise<ApiResponse<MerchantProfile>> {
  return apiClient.get(`/merchants/${id}`);
}
