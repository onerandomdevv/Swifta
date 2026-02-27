import { apiClient } from "../api-client";
import type {
  UpdateMerchantDto,
  ApiResponse,
  MerchantProfile,
} from "@hardware-os/shared";

export async function getProfile(): Promise<MerchantProfile> {
  return apiClient.get("/merchants/me");
}

export async function updateProfile(
  dto: UpdateMerchantDto,
): Promise<MerchantProfile> {
  return apiClient.patch("/merchants/me", dto);
}

export async function getPublicProfile(id: string): Promise<MerchantProfile> {
  return apiClient.get(`/merchants/${id}`);
}

export async function uploadDocument(
  file: File,
): Promise<{ url: string; message: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post("/upload/document", formData);
}

export async function getMerchants(): Promise<any[]> {
  return apiClient.get("/merchants");
}

export async function getBanks(): Promise<{ name: string; code: string }[]> {
  return apiClient.get("/payments/banks");
}

export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<{ accountName: string; accountNumber: string; bankId: number }> {
  return apiClient.get(
    `/payments/resolve-account?accountNumber=${accountNumber}&bankCode=${bankCode}`,
  );
}

export async function requestPayout(dto: {
  amount: number;
}): Promise<{ message: string; amountRequested: number; status: string }> {
  return apiClient.post("/payments/request-payout", dto);
}
