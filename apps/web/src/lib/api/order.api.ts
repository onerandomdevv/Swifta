import { apiClient } from "../api-client";
import type { Order, OrderStatus, PriceType } from "@hardware-os/shared";

export interface OrderTrackingEvent {
  id: string;
  orderId: string;
  status: string;
  note?: string | null;
  createdAt: string;
}

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

export async function addTracking(
  id: string,
  status: OrderStatus,
  note?: string,
): Promise<Order> {
  return apiClient.post(`/orders/${id}/tracking`, { status, note });
}

export async function getTracking(id: string): Promise<OrderTrackingEvent[]> {
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

export async function downloadInvoice(id: string): Promise<Blob> {
  return apiClient.download(`/orders/${id}/invoice`);
}

export interface CreateDirectOrderData {
  productId: string;
  quantity: number;
  deliveryAddress: string;
  deliveryDetails?: {
    state: string;
    lga: string;
    street: string;
    busStop?: string;
    primaryPhone?: string;
    altPhone?: string;
  };
  paymentMethod?: "ESCROW" | "DIRECT";
  deliveryMethod?: "MERCHANT_DELIVERY" | "PLATFORM_LOGISTICS";
  priceType?: PriceType;
}

export async function createDirectOrder(payload: CreateDirectOrderData): Promise<{
  orderId: string;
  authorizationUrl: string;
  totalAmountKobo: number;
  platformFeeKobo: number;
  paymentMethod: string;
}> {
  return apiClient.post("/orders/direct", payload);
}

export const getDeliveryQuote = async (
  pickupAddress: string,
  deliveryAddress: string,
  weightKg: number,
): Promise<{ costKobo: number; estimatedMinutes: number }> => {
  return apiClient.post("/logistics/quote", {
    pickupAddress,
    deliveryAddress,
    weightKg,
  });
};

export async function checkoutCart(payload: {
  cartItemIds: string[];
  deliveryAddress: string;
  deliveryDetails?: CreateDirectOrderData["deliveryDetails"];
  paymentMethod?: "ESCROW" | "DIRECT";
  deliveryMethod?: "MERCHANT_DELIVERY" | "PLATFORM_LOGISTICS";
}): Promise<{
  orderId: string;
  authorizationUrl: string;
  totalAmountKobo: number;
  platformFeeKobo: number;
  paymentMethod: string;
}> {
  return apiClient.post("/orders/checkout/cart", payload);
}
