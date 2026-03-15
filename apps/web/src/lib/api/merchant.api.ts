import { apiClient } from "../api-client";
import type {
  UpdateMerchantDto,
  ApiResponse,
  MerchantProfile,
} from "@hardware-os/shared";

export const merchantApi = {
  getProfile: (): Promise<MerchantProfile> => {
    return apiClient.get("/merchants/me");
  },

  updateBankAccount: (dto: {
    bankAccountNumber: string;
    bankCode: string;
  }): Promise<MerchantProfile> => {
    return apiClient.patch("/merchants/bank-account", dto);
  },

  updateProfile: (dto: UpdateMerchantDto): Promise<MerchantProfile> => {
    return apiClient.patch("/merchants/me", dto);
  },

  getPublicProfile: (id: string): Promise<MerchantProfile> => {
    return apiClient.get(`/merchants/${id}`);
  },

  uploadDocument: (file: File): Promise<{ url: string; message: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/upload/document", formData);
  },

  getMerchants: (): Promise<MerchantProfile[]> => {
    return apiClient.get("/merchants");
  },

  getBanks: (): Promise<{ name: string; code: string }[]> => {
    return apiClient.get("/merchants/banks/list");
  },

  resolveBankAccount: (
    accountNumber: string,
    bankCode: string,
  ): Promise<{ accountName: string; accountNumber: string; bankId: number }> => {
    return apiClient.get(
      `/merchants/bank/resolve?accountNumber=${accountNumber}&bankCode=${bankCode}`,
    );
  },

  requestPayout: (dto: {
    amount: number;
  }): Promise<{ message: string; amountRequested: number; status: string }> => {
    return apiClient.post("/payments/request-payout", dto);
  },

  submitVerification: (): Promise<MerchantProfile> => {
    return apiClient.post("/merchants/me/submit");
  },

  submitVerificationRequest: (dto: {
    governmentIdUrl: string;
    idType: string;
    cacCertUrl?: string;
  }): Promise<{ id: string; status: string; createdAt: string }> => {
    return apiClient.post("/verification/request", dto);
  },

  getVerificationStatus: (): Promise<{
    tier: string;
    verifiedAt?: string;
    pendingRequest?: {
      id: string;
      status: string;
      rejectionReason?: string;
      createdAt: string;
      governmentIdUrl?: string;
      cacCertUrl?: string;
      idType?: string;
    };
  }> => {
    return apiClient.get("/verification/status");
  },

  getAnalytics: (startDate?: string, endDate?: string): Promise<any> => {
    let url = "/merchants/me/analytics";
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient.get(url);
  },

  getBalanceSummary: (): Promise<{
    escrowBalanceKobo: string;
    availableBalanceKobo: string;
    totalRevenueKobo: string;
    pendingPayoutsKobo: string;
  }> => {
    return apiClient.get("/merchants/balance-summary");
  },

  updateUsername: (username: string): Promise<MerchantProfile> => {
    return apiClient.patch("/merchants/me/username", { username });
  },

  lookupBySlug: (slug: string): Promise<MerchantProfile> => {
    return apiClient.get(`/merchants/lookup/${slug}`);
  },

  starMerchant: (id: string): Promise<any> => {
    return apiClient.post(`/merchants/${id}/follow`, {});
  },

  unstarMerchant: (id: string): Promise<any> => {
    return apiClient.delete(`/merchants/${id}/follow`);
  },

  isStarred: (id: string): Promise<{ isFollowing: boolean }> => {
    return apiClient.get(`/merchants/${id}/is-following`);
  },
  updatePreferences: (notificationPreferences: Record<string, any>): Promise<MerchantProfile> => {
    return apiClient.patch("/merchants/me/preferences", { notificationPreferences });
  },
};
