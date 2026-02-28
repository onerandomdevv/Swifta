"use client";

import { useQuery } from "@tanstack/react-query";
import { getMerchantRFQs } from "@/lib/api/rfq.api";
import type { RFQ } from "@hardware-os/shared";

export function useMerchantRFQs() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['merchant', 'rfqs', 'recent'],
    queryFn: async () => {
      const response = await getMerchantRFQs();
      return response as RFQ[];
    },
    refetchInterval: 30000,
  });

  return { 
    rfqs: data || [], 
    loading: isLoading, 
    error: error ? (error as Error).message : null 
  };
}
