"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMerchantDashboard } from "@/hooks/use-merchant-data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dispatchOrder } from "@/lib/api/order.api";
import { useToast } from "@/providers/toast-provider";
import type { Order, RFQ } from "@hardware-os/shared";
import { DashboardSkeleton } from "@/components/merchant/dashboard/dashboard-skeleton";
import { KanbanColumn } from "@/components/merchant/dashboard/kanban-column";
import { KanbanRfqCard } from "@/components/merchant/dashboard/kanban-rfq-card";
import { KanbanOrderCard } from "@/components/merchant/dashboard/kanban-order-card";
import { WhatsAppLinkStatus } from "@/components/dashboard/whatsapp-link-status";

export default function MerchantDashboard() {
  const { rfqs, orders, user, isLoading, isError, error, refetch } =
    useMerchantDashboard();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const dispatchMutation = useMutation({
    mutationFn: dispatchOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["merchant", "orders", "all"],
      });
      toast.success("Order dispatched! OTP sent to buyer.");
    },
    onError: (err: any) => {
      console.error("Dispatch order failed:", err);
      toast.error(err?.message || "Failed to generate OTP. Please try again.");
    },
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400 mb-4">
          error
        </span>
        <p className="text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  // --- Handlers ---
  const handleReviewQuote = (id: string) => {
    // Navigate straight to the RFQ details page
    router.push(`/merchant/rfqs/${id}`);
  };

  const handleOrderAction = (id: string) => {
    const order = orders.find((o: Order) => o.id === id);
    if (order?.status === "PAID") {
      // Trigger the backend dispatch API immediately
      dispatchMutation.mutate(id);
    } else {
      // For all other statuses, click the card to view the deeper Escrow/Logistics order tracking screen
      router.push(`/merchant/orders/${id}`);
    }
  };

  // --- Filtered Arrays ---
  const pendingRfqs = rfqs.filter((r: RFQ) => r.status === "OPEN");
  const awaitingOrders = orders.filter((o: Order) => o.status === "PAID");
  const transitOrders = orders.filter((o: Order) => o.status === "DISPATCHED");
  const completedOrders = orders.filter(
    (o: Order) => o.status === "DELIVERED" || o.status === "COMPLETED",
  );

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 sm:p-6 lg:p-8 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Merchant Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-tight">
            Manage your quotes and orders in real-time.
          </p>
        </div>
        <WhatsAppLinkStatus
          isLinked={!!user?.isWhatsAppLinked}
          onSuccess={refetch}
        />
      </div>

      <div className="flex-1 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 sm:gap-6 h-full min-w-max pb-4">
          {/* Column 1: Pending Quotes */}
          <KanbanColumn
            title="Pending Quotes"
            count={pendingRfqs.length}
            colorClass="bg-amber-400"
          >
            {pendingRfqs.map((rfq: RFQ) => (
              <KanbanRfqCard
                key={rfq.id}
                rfq={rfq}
                onReview={handleReviewQuote}
              />
            ))}
            {pendingRfqs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Inbox Zero
                </span>
              </div>
            )}
          </KanbanColumn>

          {/* Column 2: Awaiting Dispatch */}
          <KanbanColumn
            title="Awaiting Dispatch"
            count={awaitingOrders.length}
            colorClass="bg-blue-500"
          >
            {awaitingOrders.map((order: Order) => (
              <KanbanOrderCard
                key={order.id}
                order={order}
                onAction={handleOrderAction}
              />
            ))}
            {awaitingOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  No pending orders
                </span>
              </div>
            )}
          </KanbanColumn>

          {/* Column 3: In Transit */}
          <KanbanColumn
            title="In Transit"
            count={transitOrders.length}
            colorClass="bg-primary"
          >
            {transitOrders.map((order: Order) => (
              <KanbanOrderCard
                key={order.id}
                order={order}
                onAction={handleOrderAction}
              />
            ))}
            {transitOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Nothing on road
                </span>
              </div>
            )}
          </KanbanColumn>

          {/* Column 4: Payout Completed */}
          <KanbanColumn
            title="Payout Completed"
            count={completedOrders.length}
            colorClass="bg-emerald-500"
          >
            {completedOrders.map((order: Order) => (
              <KanbanOrderCard
                key={order.id}
                order={order}
                onAction={handleOrderAction}
              />
            ))}
            {completedOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  No history
                </span>
              </div>
            )}
          </KanbanColumn>
        </div>
      </div>
    </div>
  );
}
