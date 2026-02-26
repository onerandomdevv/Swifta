"use client";

import React from "react";
import { useBuyerDashboard } from "@/hooks/use-buyer-data";
import { DashboardSkeleton } from "@/components/buyer/dashboard/dashboard-skeleton";
import { BuyerSummaryCards } from "@/components/buyer/dashboard/buyer-summary-cards";
import { PendingQuotes } from "@/components/buyer/dashboard/pending-quotes";
import { ActiveDeliveries } from "@/components/buyer/dashboard/active-deliveries";

export default function BuyerDashboard() {
  const { rfqs, orders, isLoading, isError, error } = useBuyerDashboard();

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

  // Pending Quotes (Action Required): An RFQ where the merchant has provided a Quote.
  const pendingQuotes = rfqs.filter((r) => r.status === "QUOTED");

  // Active Orders: Orders that are not COMPLETED or CANCELLED, but have been initialized/paid.
  const activeOrders = orders.filter(
    (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED"
  );

  return (
    <>
      <BuyerSummaryCards
        activeOrdersCount={activeOrders.length}
        pendingQuotesCount={pendingQuotes.length}
        orders={orders}
      />

      <PendingQuotes quotes={pendingQuotes} />

      <ActiveDeliveries deliveries={activeOrders} />
    </>
  );
}

