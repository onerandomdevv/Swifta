import { apiClient } from "../api-client";
import type { Category } from "@swifta/shared";

export async function getCategories(): Promise<Category[]> {
  return apiClient.get("/categories");
}

export async function getCategoryBySlug(slug: string): Promise<Category> {
  return apiClient.get(`/categories/${slug}`);
}

export async function createCategory(data: any): Promise<Category> {
  return apiClient.post("/categories", data);
}

export async function updateCategory(id: string, data: any): Promise<Category> {
  return apiClient.put(`/categories/${id}`, data);
}

export async function deleteCategory(id: string): Promise<void> {
  return apiClient.delete(`/categories/${id}`);
}
