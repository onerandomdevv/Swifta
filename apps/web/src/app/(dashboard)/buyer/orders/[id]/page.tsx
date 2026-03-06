"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrder, confirmDelivery, reportIssue } from "@/lib/api/order.api";
import { initializePayment } from "@/lib/api/payment.api";
import type { Order } from "@hardware-os/shared";
import { Modal } from "@/components/ui/modal";

// Extracted Components
import {
  BuyerOrderSummary,
  BuyerOrderActions,
  OrderInfoSidebar,
} from "@/components/buyer/orders";
import { OrderTimeline } from "@/components/ui/order-timeline";
import { useAuth } from "@/providers/auth-provider";

export default function BuyerOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [paying, setPaying] = useState(false);
  const [confirmingOtp, setConfirmingOtp] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchOrder() {
      try {
        const data = await getOrder(id as string);
        // The backend `ResponseTransformInterceptor` wraps everything in `{ data: ... }`.
        // If ApiClient unwraps it once, it might still have a nested `.data` depending on the controller return.
        const orderData = (data as any).data ? (data as any).data : data;
        setOrder(orderData as Order);
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

      if (paymentData.access_code) {
        // Use Paystack Inline instead of redirecting so React state isn't lost
        const handler = (window as any).PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_x",
          access_code: paymentData.access_code,
          onClose: () => {
            setPaying(false);
          },
          callback: (response: any) => {
            // Paystack verified client side. We redirect to our callback page to await backend webhook sync.
            router.push(
              `/buyer/orders/payment/callback?reference=${response.reference}`,
            );
          },
        });
        handler.openIframe();
      } else if (paymentData.authorization_url) {
        // Fallback to redirect if no access_code
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

  const handleReportIssue = async () => {
    if (!order || !disputeReason.trim()) return;
    setReporting(true);
    setError(null);
    try {
      const updated = await reportIssue(order.id, disputeReason);
      setOrder((updated as any).data || updated);
      setShowDisputeModal(false);
      setDisputeReason("");
    } catch (err: any) {
      setError(err?.message || "Failed to report issue");
    } finally {
      setReporting(false);
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
      <script src="https://js.paystack.co/v1/inline.js" async></script>
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
              Order #{order?.id ? order.id.slice(0, 8) : "Pending"}
            </h1>
          </div>
          <p className="text-slate-500 font-bold text-sm tracking-wide ml-14">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {order &&
            ["PAID", "DISPATCHED", "DELIVERED", "COMPLETED"].includes(
              order.status,
            ) && (
              <Link
                href={`/buyer/orders/${order.id}/receipt`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800 text-navy-dark dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg">
                  receipt_long
                </span>
                View Receipt
              </Link>
            )}
          <StatusBadge
            status={order.status}
            className="px-6 py-3 text-[10px] tracking-[0.2em]"
          />
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <OrderTimeline status={order.status} createdAt={order.createdAt} />
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
            onReportIssue={() => setShowDisputeModal(true)}
          />

          <OrderInfoSidebar order={order} />
        </div>
      </div>

      <Modal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        title="Report an Issue"
      >
        <div className="space-y-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
            Please describe the issue you're having with this order. Our admin
            team will be notified to mediate.
          </p>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="E.g. I received fewer bags than ordered, or the quality is not as described..."
            className="w-full h-40 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-sm outline-none focus:border-navy-dark dark:focus:border-white transition-all resize-none"
          />
          <div className="flex gap-4">
            <button
              onClick={() => setShowDisputeModal(false)}
              className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400"
            >
              Cancel
            </button>
            <button
              onClick={handleReportIssue}
              disabled={reporting || !disputeReason.trim()}
              className="flex-1 py-4 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
            >
              {reporting ? "Reporting..." : "Submit Report"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
