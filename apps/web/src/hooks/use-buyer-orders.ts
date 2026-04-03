"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/lib/api/order.api";
import type { Order } from "@twizrr/shared";

export function useBuyerOrders() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["buyer", "orders", "all"],
    queryFn: async () => {
      const response = await getOrders();
      return response as Order[];
    },
    refetchInterval: 30000,
  });

  return {
    orders: data || [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
