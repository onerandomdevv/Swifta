import { apiClient } from "../api-client";
import { PriceType, Product } from "@twizrr/shared";

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  priceType: PriceType;
  product: {
    name: string;
    imageUrl?: string;
    priceKobo: string;
    merchantName: string;
    merchantId: string;
    merchantTier?: string;
    merchantAddress?: string;
    unit: string;
    minOrderQuantity: number;
    minOrderQuantityConsumer: number;
  };
  itemTotalKobo: string;
}

export interface Cart {
  items: CartItem[];
  subtotalKobo: string;
}

export async function getCart(): Promise<Cart> {
  return apiClient.get<Cart>("/cart");
}

export async function addToCart(
  productId: string,
  quantity: number,
  priceType: PriceType = PriceType.RETAIL,
): Promise<Cart> {
  return apiClient.post<Cart>("/cart/items", {
    productId,
    quantity,
    priceType,
  });
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
