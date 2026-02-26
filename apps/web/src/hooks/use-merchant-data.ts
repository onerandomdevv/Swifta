"use client";

import { useQuery } from "@tanstack/react-query";
import { getMerchantRFQs } from "@/lib/api/rfq.api";
import { getOrders } from "@/lib/api/order.api";
import { getMyProducts } from "@/lib/api/product.api";
import type { RFQ, Order, Product } from "@hardware-os/shared";

export function useMerchantDashboard() {
  const rfqQuery = useQuery({
    queryKey: ["merchant", "rfqs", "recent"],
    queryFn: async () => {
      const data = await getMerchantRFQs(1, 5);
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000,
  });

  const orderQuery = useQuery({
    queryKey: ["merchant", "orders", "all"],
    queryFn: async () => {
      const data = await getOrders(1, 100);
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000,
  });

  const isLoading = rfqQuery.isLoading || orderQuery.isLoading;

  return {
    rfqs: rfqQuery.data || ([] as RFQ[]),
    orders: orderQuery.data || ([] as Order[]),
    isLoading,
    isError: rfqQuery.isError || orderQuery.isError,
    error: (() => {
      const error = rfqQuery.error || orderQuery.error;
      if (!error) return null;
      const anyErr = error as any;
      if (typeof anyErr.error === 'string') return anyErr.error;
      if (typeof (error as Error).message === 'string') return (error as Error).message;
      try {
        if (anyErr.error) return JSON.stringify(anyErr.error);
      } catch (e) {
        // Fallback
      }
      return 'Failed to load dashboard data';
    })(),
    refetch: () => {
      rfqQuery.refetch();
      orderQuery.refetch();
    },
  };
}

export function useMerchantInventory() {
  const productQuery = useQuery({
    queryKey: ["merchant", "products", "inventory"],
    queryFn: async () => {
      const data = await getMyProducts(1, 100);
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000,
  });

  return {
    products: productQuery.data || ([] as Product[]),
    isLoading: productQuery.isLoading,
    isError: productQuery.isError,
    error:
      productQuery.error instanceof Error
        ? productQuery.error.message
        : "Failed to load inventory",
    refetch: productQuery.refetch,
  };
}

