import { apiClient } from '../api-client';
import type { CreateProductDto, UpdateProductDto, Product } from '@hardware-os/shared';

export const productApi = {
  createProduct: (dto: CreateProductDto): Promise<Product> => {
    return apiClient.post('/products', dto);
  },

  updateProduct: (id: string, dto: UpdateProductDto): Promise<Product> => {
    return apiClient.patch(`/products/${id}`, dto);
  },

  deleteProduct: (id: string): Promise<void> => {
    return apiClient.delete(`/products/${id}`);
  },

  restoreProduct: (id: string): Promise<void> => {
    return apiClient.post(`/products/${id}/restore`);
  },

  getMyProducts: (page = 1, limit = 20): Promise<Product[]> => {
    return apiClient.get(`/products?page=${page}&limit=${limit}`);
  },

  getCatalogue: (search = '', category = '', page = 1, limit = 20): Promise<Product[]> => {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.append('search', search);
    if (category && category !== 'All Categories') query.append('category', category);
    return apiClient.get(`/products/catalogue?${query.toString()}`);
  },

  getProduct: (id: string): Promise<Product> => {
    return apiClient.get(`/products/${id}`);
  },

  uploadProductImage: (file: File): Promise<{ url: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/upload/product-image', formData);
  },

  getPublicProductsByMerchant: (merchantId: string, page = 1, limit = 20): Promise<Product[]> => {
    return apiClient.get(`/products/merchant/${merchantId}?page=${page}&limit=${limit}`);
  },

  getSocialFeed: (page = 1, limit = 20): Promise<{ data: Product[] }> => {
    return apiClient.get(`/products/social-feed?page=${page}&limit=${limit}`);
  }
};
