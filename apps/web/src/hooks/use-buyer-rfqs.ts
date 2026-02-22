import { useState, useEffect } from "react";
import { getMyRFQs } from "@/lib/api/rfq.api";
import type { RFQ } from "@hardware-os/shared";

export function useBuyerRFQs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);

  useEffect(() => {
    async function fetchRFQs() {
      try {
        const response = await getMyRFQs();
        setRfqs(response);
      } catch (err: any) {
        setError(err?.message || "Failed to load RFQs");
      } finally {
        setLoading(false);
      }
    }
    fetchRFQs();
  }, []);

  return { rfqs, loading, error };
}
