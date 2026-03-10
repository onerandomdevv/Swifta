"use client";

import React from "react";
import { useBuyerDashboard } from "@/hooks/use-buyer-data";
import { DashboardSkeleton } from "@/components/buyer/dashboard/dashboard-skeleton";
import { BuyerSummaryCards } from "@/components/buyer/dashboard/buyer-summary-cards";
import { ActiveDeliveries } from "@/components/buyer/dashboard/active-deliveries";
import { WhatsAppLinkStatus } from "@/components/dashboard/whatsapp-link-status";

export default function BuyerDashboard() {
  const { orders, stats, user, isLoading, isError, error, refetch } =
    useBuyerDashboard();

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

  // Active Orders: Orders that are not COMPLETED or CANCELLED, but have been initialized/paid.
  const activeOrders = orders.filter(
    (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED",
  );

  return (
    <>
      <BuyerSummaryCards
        activeOrdersCount={stats?.activeOrdersCount ?? activeOrders.length}
        totalSpendingKobo={stats?.totalSpendingKobo}
        orders={orders}
      />

      <div className="mb-8">
        <WhatsAppLinkStatus
          isLinked={!!user?.isWhatsAppLinked}
          onSuccess={refetch}
        />
      </div>

      <ActiveDeliveries deliveries={activeOrders} />
    </>
  );
}
