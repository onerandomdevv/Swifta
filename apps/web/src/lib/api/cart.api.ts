import { apiClient } from "../api-client";
import type { Product } from "@hardware-os/shared";

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  priceAtAddedKobo: string;
  addedAt: Date;
  product: Product;
}

export interface Cart {
  id: string;
  buyerId: string;
  updatedAt: Date;
  items: CartItem[];
  cartTotalKobo: string;
}

export async function getCart(): Promise<Cart> {
  return apiClient.get<Cart>("/cart");
}

export async function addToCart(
  productId: string,
  quantity: number,
): Promise<Cart> {
  return apiClient.post<Cart>("/cart/items", { productId, quantity });
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
): Promise<Cart> {
  return apiClient.patch<Cart>(`/cart/items/${itemId}`, { quantity });
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  return apiClient.delete<Cart>(`/cart/items/${itemId}`);
}

export async function clearCart(): Promise<Cart> {
  return apiClient.delete<Cart>("/cart");
}
