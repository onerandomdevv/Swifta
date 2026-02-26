"use client";

import { useQuery } from '@tanstack/react-query';
import { getMyRFQs } from '@/lib/api/rfq.api';
import { getOrders } from '@/lib/api/order.api';
import type { RFQ, Order } from '@hardware-os/shared';

export function useBuyerDashboard() {
  const rfqQuery = useQuery({
    queryKey: ['buyer', 'rfqs', 'all'],
    queryFn: async () => {
      const data = await getMyRFQs(1, 100);
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000,
  });

  const orderQuery = useQuery({
    queryKey: ['buyer', 'orders', 'all'],
    queryFn: async () => {
      const data = await getOrders(1, 100);
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000,
  });

  const isLoading = rfqQuery.isLoading || orderQuery.isLoading;
  const isError = rfqQuery.isError || orderQuery.isError;
  const error = rfqQuery.error || orderQuery.error;

  return {
    rfqs: rfqQuery.data || [] as RFQ[],
    orders: orderQuery.data || [] as Order[],
    isLoading,
    isError,
    error: error ? (error as any).error || (error as Error).message || 'Failed to load dashboard data' : null,
    refetch: () => {
      rfqQuery.refetch();
      orderQuery.refetch();
    }
  };
}
