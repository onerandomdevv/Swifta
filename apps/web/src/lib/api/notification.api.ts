import { apiClient } from '../api-client';
import type { ApiResponse, Notification } from '@hardware-os/shared';

export async function getNotifications(page = 1, limit = 20): Promise<ApiResponse<Notification[]>> {
  return apiClient.get(`/notifications?page=${page}&limit=${limit}`);
}

export async function markAsRead(id: string): Promise<ApiResponse<void>> {
  return apiClient.patch(`/notifications/${id}/read`, {});
}

export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  return apiClient.get('/notifications/unread-count');
}

export async function markAllAsRead(): Promise<ApiResponse<void>> {
  return apiClient.patch('/notifications/read-all', {});
}
