import { apiClient } from '../api-client';
import type { UpdateStockDto, ApiResponse, InventoryEvent } from '@hardware-os/shared';

export async function getStock(productId: string): Promise<ApiResponse<{ productId: string; stock: number }>> {
  return apiClient.get(`/inventory/${productId}`);
}

export async function adjustStock(dto: UpdateStockDto): Promise<ApiResponse<InventoryEvent>> {
  return apiClient.post('/inventory/adjust', dto);
}
