"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/lib/api/order.api";
import type { Order } from "@hardware-os/shared";

export function useBuyerOrders() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['buyer', 'orders', 'all'],
    queryFn: async () => {
      const response = await getOrders();
      return response as Order[];
    }
  });

  return { 
    orders: data || [], 
    loading: isLoading, 
    error: error ? (error as Error).message : null 
  };
}
