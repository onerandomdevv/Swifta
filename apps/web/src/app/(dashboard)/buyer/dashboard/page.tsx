"use client";

import React from "react";
import { useBuyerDashboard } from "@/hooks/use-buyer-data";
import { useAuth } from "@/providers/auth-provider";
import { DashboardSkeleton } from "@/components/buyer/dashboard/dashboard-skeleton";
import { BuyerKpiGrid } from "@/components/buyer/dashboard/buyer-kpi-grid";
import { BuyerQuickLinks } from "@/components/buyer/dashboard/buyer-quick-links";
import { BuyerRecentActivity } from "@/components/buyer/dashboard/recent-activity";
import { Money } from "@/components/ui/money";

export default function BuyerDashboard() {
  const { rfqs, orders, isLoading, isError, error } = useBuyerDashboard();
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
  const activeRfqCount = rfqs.filter(
    (r) => r.status === "OPEN" || r.status === "QUOTED",
  ).length;
  const pendingPayments = orders
    .filter((o) => o.status === "PENDING_PAYMENT")
    .reduce((sum, o) => sum + BigInt(o.totalAmountKobo || 0), 0n);
  const pendingPaymentCount = orders.filter(
    (o) => o.status === "PENDING_PAYMENT",
  ).length;
  const totalOrders = orders.length;
  const inTransit = orders.filter((o) => o.status === "DISPATCHED").length;

  const kpis = [
    {
      label: "Active RFQs",
      value: String(activeRfqCount),
      trend: `${rfqs.length} total`,
      trendType: "up" as const,
      icon: "description",
      subtext: `${rfqs.filter((r) => r.status === "OPEN").length} awaiting responses`,
    },
    {
      label: "Pending Payments",
      value: <Money amount={pendingPayments} />,
      badge:
        pendingPaymentCount > 0
          ? `${pendingPaymentCount} OUTSTANDING`
          : undefined,
      icon: "account_balance_wallet",
      subtext: pendingPaymentCount > 0 ? "Action required" : "All clear",
    },
    {
      label: "Total Orders",
      value: String(totalOrders),
      trend: `${inTransit} in transit`,
      trendType: "up" as const,
      icon: "local_shipping",
      subtext: `${inTransit} currently in transit`,
    },
  ];

  // --- Activities Computation ---
  const recentOrders = orders.slice(0, 4);
  const activities = recentOrders.map((order) => {
    const statusMap: Record<
      string,
      { title: string; icon: string; iconColor: string; bg: string }
    > = {
      PENDING_PAYMENT: {
        title: "Payment Required",
        icon: "payments",
        iconColor: "text-amber-500",
        bg: "bg-amber-50/50",
      },
      PAID: {
        title: "Payment Confirmed",
        icon: "check_circle",
        iconColor: "text-emerald-500",
        bg: "bg-emerald-50/50",
      },
      DISPATCHED: {
        title: "Order Shipped",
        icon: "local_shipping",
        iconColor: "text-blue-500",
        bg: "bg-blue-50/50",
      },
      COMPLETED: {
        title: "Order Delivered",
        icon: "verified",
        iconColor: "text-emerald-500",
        bg: "bg-emerald-50/50",
      },
      CANCELLED: {
        title: "Order Cancelled",
        icon: "cancel",
        iconColor: "text-red-500",
        bg: "bg-red-50/50",
      },
    };
    const info = statusMap[order.status] || {
      title: order.status,
      icon: "info",
      iconColor: "text-slate-400",
      bg: "bg-slate-50/50",
    };
    return {
      ...info,
      orderId: order.id,
      desc: (
        <>
          Order #{order.id.slice(0, 8)} —{" "}
          <Money amount={BigInt(order.totalAmountKobo)} />
        </>
      ),
      time: new Date(order.createdAt).toLocaleDateString(),
    };
  });

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display flex items-baseline gap-3">
            <span className="font-handwriting capitalize text-6xl font-medium tracking-normal text-primary lowercase">{getGreeting()},</span>
            <span>Buyer <span className="font-handwriting capitalize text-6xl font-medium tracking-normal text-primary lowercase">{user?.fullName || user?.email?.split("@")[0] || ""}</span></span>
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
            Manage your hardware procurement and marketplace activity in Lagos.
          </p>
        </div>
      </div>

      <BuyerKpiGrid kpis={kpis} pendingPaymentCount={pendingPaymentCount} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <BuyerQuickLinks />
        <BuyerRecentActivity activities={activities} />
      </div>
    </div>
  );
}
