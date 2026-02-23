import { OrderStatus } from '../enums/order-status.enum';

export interface Order {
  id: string;
  quoteId: string;
  buyerId: string;
  merchantId: string;
  totalAmountKobo: bigint;
  deliveryFeeKobo: bigint;
  currency: string;
  status: OrderStatus;
  deliveryOtp?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
  merchant?: any;
}

export interface OrderEvent {
  id: string;
  orderId: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  triggeredBy: string;
  metadata?: any;
  createdAt: Date;
}
