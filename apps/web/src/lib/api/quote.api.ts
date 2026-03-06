import { apiClient } from "../api-client";
import type { SubmitQuoteDto, Quote } from "@hardware-os/shared";

export async function submitQuote(dto: SubmitQuoteDto): Promise<Quote> {
  return apiClient.post("/quotes", dto);
}

export async function updateQuote(
  id: string,
  dto: Partial<SubmitQuoteDto>,
): Promise<Quote> {
  return apiClient.patch(`/quotes/${id}`, dto);
}

export async function acceptQuote(id: string): Promise<Quote> {
  return apiClient.post(`/quotes/${id}/accept`);
}

export async function declineQuote(id: string): Promise<Quote> {
  return apiClient.post(`/quotes/${id}/decline`);
}

export async function getQuotesByRFQ(rfqId: string): Promise<Quote[]> {
  return apiClient.get(`/quotes/rfq/${rfqId}`);
}

export async function getQuote(id: string): Promise<Quote> {
  return apiClient.get(`/quotes/${id}`);
}
