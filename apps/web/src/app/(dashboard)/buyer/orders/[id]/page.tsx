"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrder, confirmDelivery } from "@/lib/api/order.api";
import { initializePayment } from "@/lib/api/payment.api";
import type { Order } from "@hardware-os/shared";

// Extracted Components
import { BuyerOrderSummary } from "@/components/buyer/orders/buyer-order-summary";
import { BuyerOrderActions } from "@/components/buyer/orders/buyer-order-actions";
import { OrderInfoSidebar } from "@/components/buyer/orders/order-info-sidebar";

export default function BuyerOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [paying, setPaying] = useState(false);
  const [confirmingOtp, setConfirmingOtp] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const data = await getOrder(id as string);
        setOrder(data as any as Order);
      } catch (err: any) {
        setError(err?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    setError(null);
    try {
      const result = await initializePayment({ orderId: order.id });
      const paymentData = result as any;
      if (paymentData.authorization_url) {
        window.location.href = paymentData.authorization_url;
      }
    } catch (err: any) {
      setError(err?.message || "Failed to initialize payment");
      setPaying(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order || !confirmingOtp) return;
    setConfirming(true);
    setError(null);
    try {
      const updated = await confirmDelivery(order.id, confirmingOtp);
      setOrder(updated as any as Order);
    } catch (err: any) {
      setError(err?.message || "Failed to confirm delivery");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <Skeleton className="h-96 w-full rounded-[2.5rem]" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-80 w-full rounded-[2.5rem]" />
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
        <StatusBadge
          status={order.status}
          className="px-6 py-3 text-[10px] tracking-[0.2em]"
        />
      </div>

      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex gap-4">
          <span className="material-symbols-outlined text-red-500">error</span>
          <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <BuyerOrderSummary order={order} />
        </div>

        <div className="lg:col-span-4 space-y-10">
          <BuyerOrderActions
            order={order}
            paying={paying}
            onPay={handlePay}
            confirming={confirming}
            confirmingOtp={confirmingOtp}
            setConfirmingOtp={setConfirmingOtp}
            onConfirmDelivery={handleConfirmDelivery}
          />

          <OrderInfoSidebar order={order} />
        </div>
      </div>
    </div>
  );
}
