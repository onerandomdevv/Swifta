import { SharedQuoteStatus } from "../enums/shared-quote-status.enum";

export interface SharedQuoteItem {
  productName: string;
  quantity: number;
  unitPriceKobo: bigint | number;
  totalKobo: bigint | number;
}

export interface SharedQuote {
  id: string;
  merchantId: string;
  slug: string;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  items: SharedQuoteItem[];
  subtotalKobo: bigint | number;
  deliveryFeeKobo: bigint | number;
  totalKobo: bigint | number;
  note?: string | null;
  status: SharedQuoteStatus;
  expiresAt: string | Date;
  viewedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  merchantProfile?: {
    businessName: string;
    verification?: string;
  };
}
