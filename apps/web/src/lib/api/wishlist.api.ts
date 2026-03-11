import { apiClient } from "../api-client";

/**
 * Toggle a product in the user's wishlist (save/unsave).
 */
export async function toggleWishlist(
  productId: string,
): Promise<{ saved: boolean }> {
  return apiClient.post(`/wishlist/toggle/${productId}`);
}

/**
 * Get all saved products for the authenticated user.
 */
export async function getWishlist(): Promise<any[]> {
  return apiClient.get("/wishlist");
}

/**
 * Check if a specific product is saved.
 */
export async function isProductSaved(
  productId: string,
): Promise<{ saved: boolean }> {
  return apiClient.get(`/wishlist/check/${productId}`);
}

/**
 * Get all saved product IDs (bulk — for the feed).
 */
export async function getSavedProductIds(): Promise<string[]> {
  return apiClient.get("/wishlist/ids");
}
