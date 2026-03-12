"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/lib/api/order.api";
import { productApi } from "@/lib/api/product.api";
import { merchantApi } from "@/lib/api/merchant.api";
import { authApi } from "@/lib/api/auth.api";
import type { Order, Product } from "@hardware-os/shared";

export function useMerchantDashboard() {
  const orderQuery = useQuery({
    queryKey: ["merchant", "orders", "all"],
    queryFn: async () => {
      const data = await getOrders(1, 100);
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000,
  });

  const analyticsQuery = useQuery({
    queryKey: ["merchant", "analytics"],
    queryFn: () => merchantApi.getAnalytics(),
    refetchInterval: 60000,
  });

  const userQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await authApi.me();
      return response.user;
    },
    refetchInterval: 60000,
  });

  const isLoading = orderQuery.isLoading || userQuery.isLoading || analyticsQuery.isLoading;

  return {
    orders: orderQuery.data || ([] as Order[]),
    analytics: analyticsQuery.data || null,
    user: userQuery.data,
    isLoading,
    isError: orderQuery.isError || userQuery.isError || analyticsQuery.isError,
    error: (() => {
      const error = orderQuery.error || userQuery.error || analyticsQuery.error;
      if (!error) return null;
      const anyErr = error as any;
      if (typeof anyErr.error === "string") return anyErr.error;
      if (typeof (error as Error).message === "string")
        return (error as Error).message;
      try {
        if (anyErr.error) return JSON.stringify(anyErr.error);
      } catch (e) {
        // Fallback
      }
      return "Failed to load dashboard data";
    })(),
    refetch: () => {
      orderQuery.refetch();
      userQuery.refetch();
      analyticsQuery.refetch();
    },
  };
}

export function useMerchantInventory() {
  const productQuery = useQuery({
    queryKey: ["merchant", "products", "inventory"],
    queryFn: async () => {
      const data = await productApi.getMyProducts(1, 100);
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000,
  });

  return {
    products: productQuery.data || ([] as Product[]),
    isLoading: productQuery.isLoading,
    isError: productQuery.isError,
    error: (() => {
      const error = productQuery.error;
      if (!error) return null;
      const anyErr = error as any;
      if (typeof anyErr.error === "string") return anyErr.error;
      if (typeof (error as Error).message === "string")
        return (error as Error).message;
      try {
        if (anyErr.error) return JSON.stringify(anyErr.error);
      } catch (e) {
        // Fallback
      }
      return "Failed to load inventory";
    })() as string | null,
    refetch: productQuery.refetch,
  };
}
