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
      try {
        const data = await getMerchantRFQs(1, 5);
        return Array.isArray(data) ? data : [];
      } catch {
        return [] as RFQ[];
      }
    },
    refetchInterval: 30000,
  });

  const orderQuery = useQuery({
    queryKey: ["merchant", "orders", "all"],
    queryFn: async () => {
      try {
        const data = await getOrders(1, 100);
        return Array.isArray(data) ? data : [];
      } catch {
        return [] as Order[];
      }
    },
    refetchInterval: 30000,
  });

  const isLoading = rfqQuery.isLoading || orderQuery.isLoading;

  return {
    rfqs: rfqQuery.data || ([] as RFQ[]),
    orders: orderQuery.data || ([] as Order[]),
    isLoading,
    isError: false,
    error: null,
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

