import { apiClient } from '../api-client';
import type { SubmitQuoteDto, ApiResponse, Quote } from '@hardware-os/shared';

export async function submitQuote(dto: SubmitQuoteDto): Promise<ApiResponse<Quote>> {
  return apiClient.post('/quotes', dto);
}

export async function acceptQuote(id: string): Promise<ApiResponse<Quote>> {
  return apiClient.post(`/quotes/${id}/accept`);
}

export async function declineQuote(id: string): Promise<ApiResponse<Quote>> {
  return apiClient.post(`/quotes/${id}/decline`);
}

export async function getQuotesByRFQ(rfqId: string): Promise<ApiResponse<Quote[]>> {
  return apiClient.get(`/quotes/rfq/${rfqId}`);
}

export async function getQuote(id: string): Promise<ApiResponse<Quote>> {
  return apiClient.get(`/quotes/${id}`);
}
