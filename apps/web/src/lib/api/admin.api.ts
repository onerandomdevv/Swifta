import { apiClient } from "../api-client";

export async function getVerificationRequests(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.offset) query.append("offset", params.offset.toString());

  return apiClient.get(`/admin/verification/requests?${query.toString()}`);
}

export async function reviewVerificationRequest(
  requestId: string,
  dto: { decision: "APPROVED" | "REJECTED"; rejectionReason?: string }
): Promise<any> {
  return apiClient.post(`/admin/verification/requests/${requestId}/review`, dto);
}
