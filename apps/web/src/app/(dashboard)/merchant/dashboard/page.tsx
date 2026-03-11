"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMerchantDashboard } from "@/hooks/use-merchant-data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dispatchOrder } from "@/lib/api/order.api";
import { useToast } from "@/providers/toast-provider";
import { formatKobo, type Order } from "@hardware-os/shared";
import { DashboardSkeleton } from "@/components/merchant/dashboard/dashboard-skeleton";
import { KanbanColumn } from "@/components/merchant/dashboard/kanban-column";
import { KanbanOrderCard } from "@/components/merchant/dashboard/kanban-order-card";
import { WhatsAppLinkStatus } from "@/components/dashboard/whatsapp-link-status";
import { StatusBadge } from "@/components/ui/status-badge";

export default function MerchantDashboard() {
  const { orders, analytics, user, isLoading, isError, error, refetch } =
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
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-red-400">
            error
          </span>
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Failed to load dashboard</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-1">{error}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-8 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          Try Again
        </button>
      </div>
    );
  }

  const handleOrderAction = (id: string) => {
    const order = orders.find((o: Order) => o.id === id);
    if (order?.status === "PAID") {
      dispatchMutation.mutate(id);
    } else {
      router.push(`/merchant/orders/${id}`);
    }
  };

  const newOrders = orders.filter((o: Order) => o.status === "PENDING_PAYMENT");
  const awaitingOrders = orders.filter((o: Order) => o.status === "PAID");
  const transitOrders = orders.filter((o: Order) => o.status === "DISPATCHED");
  const completedOrders = orders.filter(
    (o: Order) => o.status === "DELIVERED" || o.status === "COMPLETED",
  );

  const pipelineValue = analytics ? BigInt(analytics.pipelineValue) : 0n;
  const acceptanceRate = analytics?.acceptanceRate || 0;

  const kpis = [
    {
      label: "Revenue Pipeline",
      value: formatKobo(pipelineValue),
      icon: "payments",
      color: "text-emerald-500",
    },
    {
      label: "Acceptance Rate",
      value: `${acceptanceRate}%`,
      icon: "query_stats",
      color: "text-blue-500",
    },
    {
      label: "Open RFQs",
      value: analytics?.openRfqs || 0,
      icon: "timer",
      color: "text-amber-500",
    },
  ];

  return (
    <div className="h-full max-w-[1600px] mx-auto w-full p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto no-scrollbar">
      {/* Welcome Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              Merchant Command Center
            </span>
            {user?.emailVerified && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                <span className="material-symbols-outlined text-xs">verified</span>
                Verified Partner
              </span>
            )}
          </div>
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight">
            Hi, {user?.firstName || "Partner"} 👋
          </h1>
          <p className="text-slate-500 font-medium">
            Manage your inventory, track orders, and grow your business.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/merchant/products/new"
            className="flex-1 lg:flex-none px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Product
          </Link>
          <WhatsAppLinkStatus
            isLinked={!!user?.isWhatsAppLinked}
            onSuccess={refetch}
          />
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {kpi.label}
              </p>
              <span className={`material-symbols-outlined ${kpi.color}`}>
                {kpi.icon}
              </span>
            </div>
            <h3 className="text-2xl font-black text-navy-dark dark:text-white tracking-tight">
              {kpi.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Active Pipeline</h2>
        {/* Kanban Board */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 pb-4">
          <div className="flex gap-4 sm:gap-6 min-w-max">
            <KanbanColumn
              title="New Quotes"
              count={newOrders.length}
              colorClass="bg-amber-400"
            >
              {newOrders.map((order: Order) => (
                <KanbanOrderCard
                  key={order.id}
                  order={order}
                  onAction={handleOrderAction}
                />
              ))}
              {newOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                    No new orders
                  </span>
                </div>
              )}
            </KanbanColumn>

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
                <div className="flex flex-col items-center justify-center h-32 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                    No pending dispatch
                  </span>
                </div>
              )}
            </KanbanColumn>

            <KanbanColumn
              title="On the Road"
              count={transitOrders.length}
              colorClass="bg-indigo-600"
            >
              {transitOrders.map((order: Order) => (
                <KanbanOrderCard
                  key={order.id}
                  order={order}
                  onAction={handleOrderAction}
                />
              ))}
              {transitOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                    Nothing in transit
                  </span>
                </div>
              )}
            </KanbanColumn>

            <KanbanColumn
              title="Payout History"
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
                <div className="flex flex-col items-center justify-center h-32 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                    No closed deals
                  </span>
                </div>
              )}
            </KanbanColumn>
          </div>
        </div>
      </div>

      {/* Trade History Section */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800">
          <h3 className="text-sm font-black text-navy-dark dark:text-white tracking-widest uppercase">
            Recent Trade History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Value</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    No orders recorded
                  </td>
                </tr>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-black text-navy-dark dark:text-white text-xs">#{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 font-black text-navy-dark dark:text-white text-xs">{formatKobo(BigInt(order.totalAmountKobo))}</td>
                    <td className="px-6 py-4 text-slate-500 text-[10px] font-bold uppercase">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
