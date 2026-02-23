import { RFQStatus } from '../enums/rfq-status.enum';

export interface RFQ {
  id: string;
  buyerId: string;
  productId?: string;
  merchantId: string;
  quantity: number;
  deliveryAddress: string;
  unlistedItemDetails?: any;
  product?: any;
  notes?: string;
  status: RFQStatus;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateRFQDto {
  productId?: string;
  targetMerchantId?: string;
  unlistedItemDetails?: {
    name: string;
    description?: string;
    unit: string;
  };
  quantity: number;
  deliveryAddress: string;
  notes?: string;
}
