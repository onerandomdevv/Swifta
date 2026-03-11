import { useQuery } from "@tanstack/react-query";
import { buyerApi, BuyerDashboardStats } from "@/lib/api/buyer.api";
import { getOrders } from "@/lib/api/order.api";
import { useAuth } from "@/providers/auth-provider";
import type { Order } from "@hardware-os/shared";

export function useBuyerDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const statsQuery = useQuery({
    queryKey: ["buyer", "dashboard", "stats"],
    queryFn: async () => {
      // The API client returns the unwrapped data directly
      return await buyerApi.getDashboardStats();
    },
    refetchInterval: 30000,
  });

  const orderQuery = useQuery({
    queryKey: ["buyer", "orders", "all"],
    queryFn: async () => {
      const data = await getOrders(1, 100);
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000,
  });

  const isLoading =
    statsQuery.isLoading || orderQuery.isLoading || isAuthLoading;
  const isError = statsQuery.isError || orderQuery.isError;
  const error = statsQuery.error || orderQuery.error;

  return {
    stats: statsQuery.data as BuyerDashboardStats | undefined,
    orders: orderQuery.data || ([] as Order[]),
    user,
    isLoading,
    isError,
    error: (() => {
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
      statsQuery.refetch();
      orderQuery.refetch();
    },
  };
}
