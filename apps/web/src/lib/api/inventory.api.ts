import { apiClient } from '../api-client';
import type { UpdateStockDto, ApiResponse } from '@hardware-os/shared';

export async function getStock(productId: string): Promise<ApiResponse<{ productId: string; stock: number }>> {
  return apiClient.get(`/inventory/products/${productId}/stock`);
}

export async function adjustStock(productId: string, dto: UpdateStockDto): Promise<ApiResponse<{ message: string }>> {
  return apiClient.post(`/inventory/products/${productId}/adjust`, dto);
}
