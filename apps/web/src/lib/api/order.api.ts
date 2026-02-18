import { apiClient } from '../api-client';
import type { ApiResponse, Order } from '@hardware-os/shared';

export async function getOrders(page = 1, limit = 20): Promise<ApiResponse<Order[]>> {
  return apiClient.get(`/orders?page=${page}&limit=${limit}`);
}

export async function getOrder(id: string): Promise<ApiResponse<Order>> {
  return apiClient.get(`/orders/${id}`);
}

export async function dispatchOrder(id: string): Promise<ApiResponse<Order>> {
  return apiClient.post(`/orders/${id}/dispatch`);
}

export async function confirmDelivery(id: string, otp: string): Promise<ApiResponse<Order>> {
  return apiClient.post(`/orders/${id}/confirm-delivery`, { otp });
}

export async function cancelOrder(id: string): Promise<ApiResponse<Order>> {
  return apiClient.post(`/orders/${id}/cancel`);
}

export async function disputeOrder(id: string): Promise<ApiResponse<Order>> {
  return apiClient.post(`/orders/${id}/dispute`);
}
