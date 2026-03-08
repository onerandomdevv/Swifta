import { apiClient } from "../api-client";
import { type SupplierProduct } from "@hardware-os/shared";

export async function getSupplierProfile(): Promise<any> {
  return apiClient.get("/supplier/profile");
}

export async function createSupplierProduct(dto: any): Promise<any> {
  return apiClient.post("/supplier/products", dto);
}

export async function getMySupplierProducts(): Promise<any[]> {
  return apiClient.get("/supplier/products");
}

export async function updateSupplierProduct(
  id: string,
  dto: any,
): Promise<any> {
  return apiClient.put(`/supplier/products/${id}`, dto);
}

export async function getWholesaleCatalogue(): Promise<SupplierProduct[]> {
  return apiClient.get<SupplierProduct[]>("/supplier/catalogue");
}

export async function createWholesaleOrder(data: {
  productId: string;
  quantity: number;
  deliveryAddress: string;
}): Promise<any> {
  return apiClient.post("/supplier/orders", data);
}

export async function getSupplierDashboard(): Promise<any> {
  return apiClient.get("/supplier/dashboard");
}

export async function getRecommendedCatalogue(): Promise<SupplierProduct[]> {
  return apiClient.get<SupplierProduct[]>("/supplier/recommended");
}
