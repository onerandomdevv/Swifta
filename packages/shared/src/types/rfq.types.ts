import { RFQStatus } from '../enums/rfq-status.enum';

export interface RFQ {
  id: string;
  buyerId: string;
  productId: string;
  merchantId: string;
  quantity: number;
  deliveryAddress: string;
  notes?: string;
  status: RFQStatus;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateRFQDto {
  productId: string;
  quantity: number;
  deliveryAddress: string;
  notes?: string;
}
