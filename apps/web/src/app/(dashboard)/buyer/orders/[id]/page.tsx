"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  formatKobo,
  OrderStatus,
  type Order,
} from "@hardware-os/shared";
import { useOrder } from "@/hooks/use-order";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderTimeline } from "@/components/ui/order-timeline";
import { BuyerOrderSummary } from "@/components/buyer/orders/buyer-order-summary";
import { BuyerOrderActions } from "@/components/buyer/orders/buyer-order-actions";
import { OrderInfoSidebar } from "@/components/buyer/orders/order-info-sidebar";
import { Modal } from "@/components/ui/modal";

function OrderDetailsSkeleton() {
  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto w-full space-y-10">
      <div className="flex justify-between items-end pb-8 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-2xl" />
        </div>
        <Skeleton className="h-14 w-40 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <Skeleton className="h-64 rounded-[3rem]" />
          <Skeleton className="h-96 rounded-[3rem]" />
        </div>
        <div className="lg:col-span-4 space-y-10">
          <Skeleton className="h-96 rounded-[3rem]" />
        </div>
      </div>
    </div>
  );
}

export default function BuyerOrderDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { 
    order, 
    loading, 
    error, 
    existingReview,
    paying,
    onPay,
    confirming,
    confirmingOtp,
    setConfirmingOtp,
    onConfirmDelivery,
    reportIssue 
  } = useOrder(id);
  
  const [activeTab, setActiveTab] = useState<"MANIFEST" | "TIMELINE">("MANIFEST");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [reporting, setReporting] = useState(false);

  if (loading) return <OrderDetailsSkeleton />;

  if (error || !order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 text-center space-y-6">
        <div className="w-20 h-20 rounded-[2rem] bg-red-50 dark:bg-red-950/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-red-500">priority_high</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Record Access Denied</h3>
          <p className="text-sm text-slate-500 font-bold">{error || "The requested manifest record could not be retrieved from the terminal."}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-8 py-3 bg-navy-dark dark:bg-white text-white dark:text-navy-dark rounded-xl font-black uppercase tracking-[0.2em] text-[10px]"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  const handleReportIssue = async () => {
    if (!disputeReason.trim()) return;
    setReporting(true);
    try {
      await reportIssue(disputeReason);
      setShowDisputeModal(false);
      setDisputeReason("");
    } catch {
      // Error handled in hook
    } finally {
      setReporting(false);
    }
  };

  const merchantName = order.merchant?.businessName || order.merchant?.companyName || "Industrial Merchant";
  const date = new Date(order.createdAt).toLocaleDateString("en-NG", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto w-full space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <script src="https://js.paystack.co/v1/inline.js" async></script>
      
      {/* ─── Header ─── */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Manifest Record</p>
             <div className="h-px w-8 bg-slate-200 dark:bg-slate-700" />
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-navy-dark dark:text-white tracking-tighter uppercase font-display leading-none">
            {merchantName.split(" ")[0]} <span className="text-primary opacity-80">{merchantName.split(" ").slice(1).join(" ")}</span>
          </h1>
          <div className="flex items-center gap-4 text-slate-500 font-bold text-xs">
             <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">event_repeat</span>
                Initialized {date}
             </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {["PAID", "DISPATCHED", "DELIVERED", "COMPLETED"].includes(order.status) && (
             <Link
                href={`/buyer/orders/${order.id}/receipt`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800 text-navy-dark dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all"
             >
                <span className="material-symbols-outlined text-lg">receipt_long</span>
                Receipt
             </Link>
           )}
           <StatusBadge status={order.status} className="px-6 py-3 text-[10px] tracking-[0.2em]" />
           <button
            onClick={() => router.back()}
            className="px-8 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary transition-all shadow-sm active:scale-95"
          >
            Hub
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* ─── Left Column: Core Data ─── */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Navigation Tabs */}
          <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800 w-fit">
             <button
              onClick={() => setActiveTab("MANIFEST")}
              className={`px-8 py-2.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "MANIFEST" 
                ? "bg-white dark:bg-slate-800 text-navy-dark dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-none" 
                : "text-slate-400 hover:text-navy-dark dark:hover:text-white"
              }`}
             >
               Order Manifest
             </button>
             <button
              onClick={() => setActiveTab("TIMELINE")}
              className={`px-8 py-2.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "TIMELINE" 
                ? "bg-white dark:bg-slate-800 text-navy-dark dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-none" 
                : "text-slate-400 hover:text-navy-dark dark:hover:text-white"
              }`}
             >
               Execution Timeline
             </button>
          </div>

          {activeTab === "MANIFEST" ? (
            <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
               {/* Review Prompt Banner if completed */}
               {(order.status === "COMPLETED" || order.status === "DELIVERED") && (
                 existingReview ? (
                   <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-[2.5rem] p-8 flex items-center gap-6">
                      <div className="size-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center text-emerald-600">
                        <span className="material-symbols-outlined text-3xl font-black">verified</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.2em] mb-1">Feedback Logged</p>
                        <h4 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-tighter">You rated this experience ⭐ {existingReview.rating}/5</h4>
                      </div>
                      <Link href={`/buyer/orders/${order.id}/review`} className="px-6 py-3 bg-white dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm">View</Link>
                   </div>
                 ) : (
                   <Link 
                    href={`/buyer/orders/${order.id}/review`}
                    className="block bg-gradient-to-r from-amber-400 to-orange-400 rounded-[2.5rem] p-8 text-navy-dark shadow-xl shadow-amber-400/20 group hover:scale-[1.01] transition-all"
                   >
                     <div className="flex items-center gap-6">
                        <div className="size-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                          <span className="material-symbols-outlined text-3xl font-black">star</span>
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Industrial Feedback Protocol</p>
                           <h4 className="text-2xl font-black uppercase tracking-tighter">Rate this Merchant Settlement</h4>
                        </div>
                        <div className="ml-auto">
                           <span className="material-symbols-outlined text-3xl">arrow_forward</span>
                        </div>
                     </div>
                   </Link>
                 )
               )}

               {/* Summary Table */}
               <div className="bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/40 dark:shadow-none">
                  <BuyerOrderSummary order={order} />
               </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[3rem] p-12 shadow-2xl shadow-slate-200/40 dark:shadow-none animate-in fade-in slide-in-from-right-8 duration-500">
               <OrderTimeline 
                status={order.status} 
                createdAt={order.createdAt} 
                trackingEvents={[]} 
               />
            </div>
          )}
        </div>

        {/* ─── Right Column: Sidebar Actions & Intelligence ─── */}
        <div className="lg:col-span-4 space-y-10">
          <div className="sticky top-10 space-y-10">
            {/* Action Center */}
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[3rem] p-10 shadow-2xl shadow-slate-200/40 dark:shadow-none">
              <BuyerOrderActions
                order={order}
                paying={paying}
                onPay={onPay}
                confirming={confirming}
                confirmingOtp={confirmingOtp}
                setConfirmingOtp={setConfirmingOtp}
                onConfirmDelivery={onConfirmDelivery}
                onReportIssue={() => setShowDisputeModal(true)}
              />
            </div>

            <div className="bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[3rem] p-10 shadow-2xl shadow-slate-200/40 dark:shadow-none">
                <OrderInfoSidebar order={order} />
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-primary text-xl">verified</span>
                  <p className="text-[11px] font-black text-navy-dark dark:text-white uppercase tracking-widest">Escrow Insurance</p>
               </div>
               <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                  Funds are secured in hardware-escrow. Capital is only released upon successful manifest verification by the procurement officer.
               </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dispute Modal */}
      <Modal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        title="Report Protocol Violation"
      >
        <div className="space-y-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
            Specify the manifest discrepancy. The SwiftTrade mediation terminal will initiate a review within 24 standard hours.
          </p>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Describe the discrepancy in detail..."
            className="w-full h-40 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-sm outline-none focus:border-navy-dark dark:focus:border-white transition-all resize-none font-bold placeholder:opacity-50"
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
              className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-xl shadow-red-500/20"
            >
              {reporting ? "Logging violation..." : "Submit Violation"}
            </button>
          </div>
        </div>
      </Modal>

      <div className="h-20" />
    </div>
  );
}
