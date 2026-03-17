import { OrderStatus } from "../enums/order-status.enum";
import { OrderDisputeStatus } from "../enums/order-dispute-status.enum";

export interface Order {
  id: string;
  buyerId: string;
  merchantId: string;
  totalAmountKobo: bigint;
  deliveryFeeKobo: bigint;
  platformFeeKobo?: bigint;
  platformFeePercent?: number;
  currency: string;
  status: OrderStatus;
  deliveryAddress?: string;
  deliveryDetails?: {
    state: string;
    lga: string;
    street: string;
    busStop?: string;
    primaryPhone?: string;
    altPhone?: string;
  };
  deliveryMethod?: "MERCHANT_DELIVERY" | "PLATFORM_LOGISTICS";
  deliveryOtp?: string;
  disputeStatus: OrderDisputeStatus;
  disputeReason?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
  merchant?: any;

  product?: any;
  review?: any;
  buyer?: any;
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
