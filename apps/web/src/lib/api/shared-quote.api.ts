import { apiClient } from "../api-client";

export interface SharedQuoteItem {
  productName: string;
  quantity: number;
  unitPriceKobo: number;
  totalKobo: number;
}

export interface SharedQuote {
  id: string;
  merchantId: string;
  slug: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  items: SharedQuoteItem[];
  subtotalKobo: number;
  deliveryFeeKobo: number;
  totalKobo: number;
  note?: string;
  status: string;
  expiresAt: string;
  viewedAt?: string;
  createdAt: string;
  updatedAt: string;
  merchantProfile?: {
    businessName: string;
    verification: string;
  };
}

export interface CreateSharedQuoteDto {
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  items: SharedQuoteItem[];
  subtotalKobo: number;
  deliveryFeeKobo?: number;
  totalKobo: number;
  note?: string;
  expiresAt?: string;
}

export async function createSharedQuote(
  dto: CreateSharedQuoteDto,
): Promise<SharedQuote> {
  return apiClient.post("/quotes/shared", dto);
}

export async function listSharedQuotes(
  page = 1,
  limit = 20,
  status?: string,
): Promise<{
  data: SharedQuote[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const params: Record<string, string> = {
    page: String(page),
    limit: String(limit),
  };
  if (status) params.status = status;
  return apiClient.get("/quotes/shared", { params });
}

export async function getPublicSharedQuote(slug: string): Promise<SharedQuote> {
  return apiClient.get(`/quotes/shared/${slug}/public`);
}

export async function updateSharedQuote(
  id: string,
  dto: Partial<CreateSharedQuoteDto>,
): Promise<SharedQuote> {
  return apiClient.patch(`/quotes/shared/${id}`, dto);
}

export async function getProductAssociations(category: string) {
  return apiClient.get<
    { productCategoryB: string; strength: number; promptText: string }[]
  >("/products/associations", { params: { category } });
}
