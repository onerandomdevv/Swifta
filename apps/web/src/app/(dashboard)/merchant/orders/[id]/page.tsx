"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrder, addTracking, getTracking } from "@/lib/api/order.api";
import { type Order, OrderStatus } from "@hardware-os/shared";

// Extracted Components
import { formatKobo } from "@/lib/utils";
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
      <div className="space-y-10 py-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto">
        <div className="space-y-4">
          <Skeleton className="h-14 w-80 rounded-2xl" />
          <Skeleton className="h-4 w-48 ml-2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <Skeleton className="h-[400px] w-full rounded-[3rem]" />
            <Skeleton className="h-[300px] w-full rounded-[3rem]" />
          </div>
          <div className="lg:col-span-4 space-y-8">
            <Skeleton className="h-64 w-full rounded-[3rem]" />
            <Skeleton className="h-80 w-full rounded-[3rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center space-y-8 max-w-[1200px] mx-auto">
        <div className="size-24 rounded-full bg-red-50 flex items-center justify-center border-4 border-white shadow-xl">
          <span className="material-symbols-outlined text-5xl text-red-500">error</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-navy-dark tracking-tight uppercase">Order Not Found</h2>
          <p className="text-slate-500 max-w-sm mx-auto font-medium">{error}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-10 py-4 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-navy-dark/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Return to Registry
        </button>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-[1400px] mx-auto w-full p-4 md:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Dynamic Header Component */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-8 border-b border-slate-100 dark:border-slate-800 pb-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="group size-12 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-navy-dark hover:border-navy-dark transition-all"
            >
              <span className="material-symbols-outlined text-xl text-slate-400 group-hover:text-white transition-colors">
                arrow_back
              </span>
            </button>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5">Manifest Record</p>
              <h1 className="text-4xl lg:text-5xl font-black text-navy-dark dark:text-white tracking-tighter uppercase font-display leading-none">
                {order.id.slice(0, 8)}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-6 ml-14">
             <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-300 text-lg">calendar_today</span>
                <p className="text-slate-500 font-black text-[10px] tracking-widest uppercase">
                  Log Entry: {new Date(order.createdAt).toLocaleDateString("en-NG", { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
             </div>
             <div className="size-1 bg-slate-200 rounded-full"></div>
             <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-300 text-lg">payments</span>
                <p className="text-slate-500 font-black text-[10px] tracking-widest uppercase">
                  Payout status: <span className="text-navy-dark dark:text-white">{(order as any).payoutStatus || 'PENDING'}</span>
                </p>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-end shrink-0">
          <StatusBadge
            status={order.status}
            className="px-8 py-4 text-[11px] tracking-[0.25em] shadow-xl shadow-slate-200 dark:shadow-none bg-white dark:bg-slate-900 border-2"
          />
          
          <div className="flex items-center gap-2">
            {order.status === "PAID" && (
              <button
                onClick={() => handleUpdateStatus("PREPARING")}
                disabled={isUpdating}
                className="group flex items-center gap-3 px-10 py-4 bg-navy-dark text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-navy-dark/30 hover:bg-navy-light transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">inventory</span>
                {isUpdating ? "Processing..." : "Commit to Prep"}
              </button>
            )}

            {order.status === "PREPARING" && (
              <button
                onClick={() => handleUpdateStatus("DISPATCHED")}
                disabled={isUpdating}
                className="group flex items-center gap-3 px-10 py-4 bg-orange-500 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/30 hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">local_shipping</span>
                {isUpdating ? "Dispatching..." : "Authorize Dispatch"}
              </button>
            )}

            {order.status === "DISPATCHED" && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-lg ring-4 ring-slate-50 dark:ring-slate-800/20">
                <input
                  type="text"
                  placeholder="Intelligence note (e.g. Loading at Wharf)"
                  value={transitNote}
                  onChange={(e) => setTransitNote(e.target.value)}
                  className="px-5 py-3 border-none rounded-xl text-xs dark:bg-slate-900 outline-none w-64 font-medium"
                  disabled={isUpdating}
                />
                <button
                  onClick={() => handleUpdateStatus("IN_TRANSIT", transitNote)}
                  disabled={isUpdating}
                  className="px-8 py-3 bg-navy-dark text-white rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-navy-light transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  Broadcast Update
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Audit Warnings */}
      {error && (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-3xl flex gap-5 items-center animate-in zoom-in-95 duration-500">
          <div className="size-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border border-rose-200">
            <span className="material-symbols-outlined text-rose-500">warning</span>
          </div>
          <p className="text-xs font-black text-rose-800 dark:text-rose-400 uppercase tracking-widest">
            System Alert: {error}
          </p>
        </div>
      )}

      {order.status === "DISPUTE" && (
        <div className="p-8 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 rounded-[2.5rem] flex gap-6 items-start shadow-xl shadow-amber-500/5 animate-pulse">
          <div className="size-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="material-symbols-outlined text-white text-3xl">gavel</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-amber-700 dark:text-amber-400 uppercase tracking-[0.2em]">Dispute Escalation Active</h3>
            <p className="text-xs font-semibold text-amber-800/80 dark:text-amber-300/80 leading-relaxed max-w-3xl">
              Logistics integrity questioned: {order.disputeReason || "General mediation required. Payments frozen until resolution."}
            </p>
          </div>
        </div>
      )}

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 space-y-10">
          <OrderTimeline 
            status={order.status} 
            createdAt={order.createdAt} 
            trackingEvents={trackingEvents} 
            className="rounded-[3rem] border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none p-10"
          />
          <FulfillmentDetails order={order} />
          <MerchantOrderGuide order={order} />
        </div>
        
        <aside className="lg:col-span-4 space-y-10 sticky top-8">
          <OrderReferenceSidebar order={order} />
          
          {/* Action Card */}
          <div className="bg-navy-dark p-8 rounded-[3rem] text-white space-y-6 shadow-2xl shadow-navy-dark/40">
             <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center">
                   <span className="material-symbols-outlined text-primary">analytics</span>
                </div>
                <div>
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Escrow Balance</p>
                   <p className="text-2xl font-black tabular-nums tracking-tighter">
                      {formatKobo(order.totalAmountKobo)}
                   </p>
                </div>
             </div>
             <div className="h-px bg-white/10 w-full"></div>
             <div className="space-y-4">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-relaxed">
                   Funds are secured in SwiftTrade's industrial escrow. Payout triggers immediately upon delivery confirmation.
                </p>
                <button
                  onClick={() => router.push(`/merchant/orders/${order.id}/dispatch-slip`)}
                  className="w-full py-4 bg-white text-navy-dark rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">print</span>
                  Generate Slip
                </button>
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
