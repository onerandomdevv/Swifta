import { apiClient } from "../api-client";

export interface VerificationRequestData {
  id: string;
  merchantId: string;
  status: string;
  governmentIdUrl: string;
  cacCertUrl?: string;
  idType: string;
  createdAt: string;
  merchant: {
    id: string;
    businessName: string;
    verificationTier: string;
    user: { email: string; phone: string };
  };
}

export interface VerificationRequestsResponse {
  data: VerificationRequestData[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function getVerificationRequests(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<VerificationRequestsResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.limit !== undefined) query.append("limit", params.limit.toString());
  if (params?.offset !== undefined) query.append("offset", params.offset.toString());

  return apiClient.get(`/admin/verification/requests?${query.toString()}`);
}

export async function reviewVerificationRequest(
  requestId: string,
  dto: { decision: "APPROVED" | "REJECTED"; rejectionReason?: string }
): Promise<{ message: string; decision: string }> {
  return apiClient.post(`/admin/verification/requests/${encodeURIComponent(requestId)}/review`, dto);
}
