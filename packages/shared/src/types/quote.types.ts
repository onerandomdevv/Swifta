import { QuoteStatus } from '../enums/quote-status.enum';

export interface Quote {
  id: string;
  rfqId: string;
  merchantId: string;
  unitPriceKobo: bigint;
  totalPriceKobo: bigint;
  deliveryFeeKobo: bigint;
  currency: string;
  notes?: string;
  validUntil: Date;
  status: QuoteStatus;
  createdAt: Date;
  merchant?: any;
}

export interface SubmitQuoteDto {
  rfqId: string;
  unitPriceKobo: bigint;
  totalPriceKobo: bigint;
  deliveryFeeKobo: bigint;
  validUntil: Date;
  notes?: string;
}
