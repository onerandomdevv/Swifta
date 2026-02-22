import { useState, useEffect } from "react";
import { getOrders } from "@/lib/api/order.api";
import type { Order } from "@hardware-os/shared";

export function useBuyerOrders() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await getOrders();
        setOrders(response);
      } catch (err: any) {
        setError(err?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return { orders, loading, error };
}
