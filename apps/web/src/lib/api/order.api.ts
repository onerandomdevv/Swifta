import { apiClient } from "../api-client";
import type { Order } from "@hardware-os/shared";

export async function getOrders(page = 1, limit = 20): Promise<Order[]> {
  return apiClient.get(`/orders?page=${page}&limit=${limit}`);
}

export async function getOrderSummary(): Promise<{
  escrow: number | bigint;
  paidOut: number | bigint;
  pending: number | bigint;
  failed: number | bigint;
  orderCount: number;
}> {
  return apiClient.get("/orders/summary");
}

export async function getOrder(id: string): Promise<Order> {
  return apiClient.get(`/orders/${id}`);
}

export async function dispatchOrder(id: string): Promise<Order> {
  return apiClient.post(`/orders/${id}/dispatch`);
}

export async function addTracking(id: string, status: string, note?: string): Promise<Order> {
  return apiClient.post(`/orders/${id}/tracking`, { status, note });
}

export async function getTracking(id: string): Promise<any[]> {
  return apiClient.get(`/orders/${id}/tracking`);
}

export async function confirmDelivery(id: string, otp: string): Promise<Order> {
  return apiClient.post(`/orders/${id}/confirm-delivery`, { otp });
}

export async function cancelOrder(id: string): Promise<Order> {
  return apiClient.post(`/orders/${id}/cancel`);
}

export async function reportIssue(id: string, reason: string): Promise<Order> {
  return apiClient.post(`/orders/${id}/report-issue`, { reason });
}

export async function getReceipt(id: string): Promise<Order> {
  return apiClient.get(`/orders/${id}/receipt`);
}

export async function createDirectOrder(payload: {
  productId: string;
  quantity: number;
  deliveryAddress: string;
  paymentMethod?: "ESCROW" | "DIRECT";
}): Promise<{ orderId: string; authorizationUrl: string; totalAmountKobo: number; platformFeeKobo: number; paymentMethod: string }> {
  return apiClient.post("/orders/direct", payload);
}
