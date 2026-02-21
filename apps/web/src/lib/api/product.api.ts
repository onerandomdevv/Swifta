import { apiClient } from '../api-client';
import type { CreateProductDto, UpdateProductDto, Product } from '@hardware-os/shared';

export async function createProduct(dto: CreateProductDto): Promise<Product> {
  return apiClient.post('/products', dto);
}

export async function updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
  return apiClient.patch(`/products/${id}`, dto);
}

export async function deleteProduct(id: string): Promise<void> {
  return apiClient.delete(`/products/${id}`);
}

export async function restoreProduct(id: string): Promise<void> {
  return apiClient.post(`/products/${id}/restore`);
}

export async function getMyProducts(page = 1, limit = 20): Promise<Product[]> {
  return apiClient.get(`/products?page=${page}&limit=${limit}`);
}

export async function getCatalogue(search = '', page = 1, limit = 20): Promise<Product[]> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) query.append('search', search);
  return apiClient.get(`/products/catalogue?${query.toString()}`);
}

export async function getProduct(id: string): Promise<Product> {
  return apiClient.get(`/products/${id}`);
}
