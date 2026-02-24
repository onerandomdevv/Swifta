"use client";

import { useQuery } from '@tanstack/react-query';
import { getMerchantRFQs } from '@/lib/api/rfq.api';
import { getOrders } from '@/lib/api/order.api';
import type { RFQ, Order } from '@hardware-os/shared';

export function useMerchantDashboard() {
  const rfqQuery = useQuery({
    queryKey: ['merchant', 'rfqs', 'recent'],
    queryFn: async () => {
      const data = await getMerchantRFQs(1, 5);
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000,
  });

  const orderQuery = useQuery({
    queryKey: ['merchant', 'orders', 'all'],
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
    error: error instanceof Error ? error.message : 'Failed to load dashboard data',
    refetch: () => {
      rfqQuery.refetch();
      orderQuery.refetch();
    }
  };
}
