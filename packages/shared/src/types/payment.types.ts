import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentDirection } from '../enums/payment-direction.enum';

export interface Payment {
  id: string;
  orderId: string;
  paystackReference: string;
  paystackTransferRef?: string;
  amountKobo: bigint;
  currency: string;
  status: PaymentStatus;
  direction: PaymentDirection;
  idempotencyKey: string;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface PaymentEvent {
  id: string;
  paymentId: string;
  eventType: string;
  payload: any;
  createdAt: Date;
}

export interface InitializePaymentDto {
  orderId: string;
}
