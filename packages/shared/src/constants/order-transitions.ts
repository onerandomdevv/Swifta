import { OrderStatus } from '../enums/order-status.enum';

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.DISPATCHED, OrderStatus.CANCELLED],
  [OrderStatus.DISPATCHED]: [OrderStatus.DELIVERED, OrderStatus.DISPUTE],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.DISPUTE]: []
};
