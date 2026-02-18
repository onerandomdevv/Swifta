import { apiClient } from '../api-client';
import type { CreateProductDto, UpdateProductDto, ApiResponse, Product } from '@hardware-os/shared';

export async function createProduct(dto: CreateProductDto): Promise<ApiResponse<Product>> {
  return apiClient.post('/products', dto);
}

export async function updateProduct(id: string, dto: UpdateProductDto): Promise<ApiResponse<Product>> {
  return apiClient.patch(`/products/${id}`, dto);
}

export async function deleteProduct(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete(`/products/${id}`);
}

export async function restoreProduct(id: string): Promise<ApiResponse<void>> {
  return apiClient.post(`/products/${id}/restore`);
}

export async function getMyProducts(page = 1, limit = 20): Promise<ApiResponse<Product[]>> {
  return apiClient.get(`/products?page=${page}&limit=${limit}`);
}

export async function getCatalogue(search = '', page = 1, limit = 20): Promise<ApiResponse<Product[]>> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) query.append('search', search);
  return apiClient.get(`/products/catalogue?${query.toString()}`);
}

export async function getProduct(id: string): Promise<ApiResponse<Product>> {
  return apiClient.get(`/products/${id}`);
}
