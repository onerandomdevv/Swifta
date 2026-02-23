"use client";

import React from "react";
import Link from "next/link";
import { useMerchantDashboard } from "@/hooks/use-merchant-data";
import { useAuth } from "@/providers/auth-provider";
import { DashboardSkeleton } from "@/components/merchant/dashboard/dashboard-skeleton";
import { MerchantKpiGrid } from "@/components/merchant/dashboard/merchant-kpi-grid";
import { IncomingRfqs } from "@/components/merchant/dashboard/incoming-rfqs";
import { MerchantQuickActions } from "@/components/merchant/dashboard/quick-actions";

export default function MerchantDashboard() {
  const { rfqs, orders, isLoading, isError, error } = useMerchantDashboard();
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

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

  // --- KPI Computation ---
  const activeOrders = orders.filter(
    (o) => o.status !== "CANCELLED" && o.status !== "DISPUTE",
  );
  const pipelineValue = activeOrders.reduce(
    (sum, o) => sum + BigInt(o.totalAmountKobo || 0),
    0n,
  );
  const activeRfqCount = rfqs.filter(
    (r) => r.status === "OPEN" || r.status === "QUOTED",
  ).length;
  const incompleteOrders = orders.filter(
    (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED",
  ).length;

  const stats = [
    {
      label: "Pipeline Value",
      value: pipelineValue,
      isMoney: true,
      trend: `${activeOrders.length} orders`,
      trendType:
        activeOrders.length > 0 ? ("up" as const) : ("neutral" as const),
      icon: "account_balance_wallet",
      sub: `Calculated from ${activeOrders.length} active orders`,
    },
    {
      label: "Active RFQs",
      value: String(activeRfqCount),
      isMoney: false,
      trend: `${rfqs.length} total`,
      trendType: activeRfqCount > 0 ? ("up" as const) : ("neutral" as const),
      icon: "description",
      sub: "Requires immediate response",
    },
    {
      label: "Incomplete Orders",
      value: String(incompleteOrders),
      isMoney: false,
      badge: incompleteOrders > 5 ? `${incompleteOrders} PENDING` : undefined,
      icon: "inventory_2",
      sub: "Awaiting dispatch or payment",
    },
    {
      label: "Total Orders",
      value: String(orders.length),
      isMoney: false,
      trend: "All time",
      trendType: orders.length > 0 ? ("up" as const) : ("neutral" as const),
      icon: "speed",
      sub: "Completed + in-progress",
    },
  ];

  // --- Recent RFQs Computation ---
  const recentRfqs = rfqs.slice(0, 3);

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display flex items-baseline gap-3">
            <span className="font-handwriting capitalize text-6xl font-medium tracking-normal text-primary lowercase">{getGreeting()},</span>
            <span>Merchant <span className="font-handwriting capitalize text-6xl font-medium tracking-normal text-primary lowercase">{user?.fullName || user?.email?.split("@")[0] || ""}</span></span>
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
            Enterprise Trading Hub
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/merchant/products/new"
            className="flex items-center gap-2 px-8 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-dark/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add_box</span>
            Add Product
          </Link>
        </div>
      </div>

      <MerchantKpiGrid stats={stats} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <IncomingRfqs recentRfqs={recentRfqs} />
        <MerchantQuickActions />
      </div>
    </div>
  );
}
