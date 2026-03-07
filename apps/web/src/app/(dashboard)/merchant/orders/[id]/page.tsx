"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrder, addTracking, getTracking } from "@/lib/api/order.api";
import { type Order, OrderStatus } from "@hardware-os/shared";

// Extracted Components
import {
  FulfillmentDetails,
  MerchantOrderGuide,
  OrderReferenceSidebar,
} from "@/components/merchant/orders";
import { OrderTimeline } from "@/components/ui/order-timeline";

export default function MerchantOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<any[]>([]);
  const [transitNote, setTransitNote] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        const [data, trackingData] = await Promise.all([
          getOrder(id as string),
          getTracking(id as string).catch(() => []),
        ]);
        const orderData = (data as any).data || data;
        const trackingList = (trackingData as any).data || trackingData;
        setOrder(orderData as Order);
        setTrackingEvents(Array.isArray(trackingList) ? trackingList : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  const trackingMutation = useMutation({
    mutationFn: ({ status, note }: { status: string; note?: string }) =>
      addTracking(order?.id as string, status as OrderStatus, note),
    onMutate: async ({ status }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["merchant", "orders"] });

      const previousOrder = { ...order };

      if (order) {
        setOrder({ ...order, status: status as any });
      }

      return { previousOrder };
    },
    onError: (err: any, _, context) => {
      setError(err?.message || `Failed to update status`);
      if (context?.previousOrder) {
        setOrder(context.previousOrder as Order);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant", "orders"] });
    },
    onSuccess: (updated) => {
      const updatedOrder = (updated as any).data || updated;
      setOrder(updatedOrder as Order);
      // Re-fetch tracking to get latest notes
      getTracking(order?.id as string)
        .then((res) => {
          const list = (res as any).data || res;
          if (Array.isArray(list)) setTrackingEvents(list);
        })
        .catch(console.error);
      setTransitNote("");
    },
  });

  const handleUpdateStatus = (status: string, note?: string) => {
    if (!order) return;
    setError(null);
    trackingMutation.mutate({ status, note });
  };

  const isUpdating = trackingMutation.isPending;

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <Skeleton className="h-[500px] w-full rounded-[2.5rem]" />
          </div>
          <div className="lg:col-span-4 space-y-8">
            <Skeleton className="h-80 w-full rounded-[2.5rem]" />
            <Skeleton className="h-64 w-full rounded-[2.5rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <span className="material-symbols-outlined text-5xl text-red-400">
          error
        </span>
        <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
          {error}
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.back()}
              className="size-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">
                arrow_back
              </span>
            </button>
            <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
              Order #{order.id.slice(0, 8)}
            </h1>
          </div>
          <p className="text-slate-500 font-bold text-sm tracking-wide ml-14">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-col gap-4 items-end">
          <StatusBadge
            status={order.status}
            className="px-6 py-3 text-[10px] tracking-[0.2em] w-fit"
          />
          {order.status === "PAID" && (
            <button
              onClick={() => handleUpdateStatus("PREPARING")}
              disabled={isUpdating}
              className="flex items-center gap-2 px-8 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-dark/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">
                inventory
              </span>
              {isUpdating ? "Updating..." : "Mark as Preparing"}
            </button>
          )}

          {order.status === "PREPARING" && (
            <button
              onClick={() => handleUpdateStatus("DISPATCHED")}
              disabled={isUpdating}
              className="flex items-center gap-2 px-8 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-dark/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">
                local_shipping
              </span>
              {isUpdating ? "Dispatching..." : "Mark as Dispatched"}
            </button>
          )}

          {order.status === "DISPATCHED" && (
            <div className="flex items-center gap-2 w-full max-w-sm">
              <input
                type="text"
                placeholder="e.g. Truck left Alaba heading to Lekki"
                value={transitNote}
                onChange={(e) => setTransitNote(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:bg-slate-900 outline-none focus:border-primary transition-colors"
                disabled={isUpdating}
              />
              <button
                onClick={() => handleUpdateStatus("IN_TRANSIT", transitNote)}
                disabled={isUpdating}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-lg">
                  directions_car
                </span>
                {isUpdating ? "..." : "In Transit"}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex gap-4">
          <span className="material-symbols-outlined text-red-500">error</span>
          <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
            {error}
          </p>
        </div>
      )}

      {order.status === "DISPUTE" && (
        <div className="p-6 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 rounded-2xl flex gap-4 items-start shadow-sm mb-6">
          <span className="material-symbols-outlined text-orange-500 text-2xl">
            report_problem
          </span>
          <div>
            <h3 className="text-sm font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest mb-2">
              Buyer Reported an Issue
            </h3>
            <p className="text-xs font-semibold text-orange-800/80 dark:text-orange-300/80 leading-relaxed max-w-2xl">
              {order.disputeReason ||
                "The buyer has reported an issue with this order. Our admin team will contact both parties to mediate shortly."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {" "}
        <div className="lg:col-span-8 space-y-8">
          <OrderTimeline status={order.status} createdAt={order.createdAt} trackingEvents={trackingEvents} />
          <FulfillmentDetails order={order} />
          <MerchantOrderGuide order={order} />
        </div>
        <OrderReferenceSidebar order={order} />
      </div>
    </div>
  );
}
