import { useQuery } from "@tanstack/react-query";
import { getMyRFQs } from "@/lib/api/rfq.api";
import type { RFQ } from "@hardware-os/shared";

export function useBuyerRFQs() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['buyer', 'rfqs', 'all'],
    queryFn: async () => {
      const response = await getMyRFQs();
      return response as RFQ[];
    }
  });

  return { 
    rfqs: data || [], 
    loading: isLoading, 
    error: error ? (error as Error).message : null 
  };
}
