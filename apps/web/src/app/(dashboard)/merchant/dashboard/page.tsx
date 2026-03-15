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
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export default function MerchantDashboard() {
  const [filter, setFilter] = React.useState<"ALL" | "TODAY" | "7D" | "30D">("ALL");
  
  const dateParams = React.useMemo(() => {
    const now = new Date();
    switch (filter) {
      case "TODAY":
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        return { startDate: startOfToday.toISOString() };
      case "7D":
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return { startDate: sevenDaysAgo.toISOString() };
      case "30D":
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return { startDate: thirtyDaysAgo.toISOString() };
      default:
        return {};
    }
  }, [filter]);

  const { orders, analytics, user, isLoading, isError, error, refetch } =
    useMerchantDashboard(dateParams.startDate);
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
      label: "Total Sales",
      value: formatKobo(pipelineValue),
      icon: "payments",
      color: "text-emerald-500",
    },
    {
      label: "Success Rate",
      value: `${acceptanceRate}%`,
      icon: "query_stats",
      color: "text-blue-500",
    },
    {
      label: "Completed Orders",
      value: analytics?.completedOrders || 0,
      icon: "check_circle",
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#f8fafd] dark:bg-[#0A2540] transition-colors duration-200 no-scrollbar">
      <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* KPI Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {kpis.map((kpi, idx) => {
            const isRevenue = kpi.label === "Revenue Pipeline";
            
            // Note: Trends are currently hidden as they are not yet supported by the analytics API
            const hasTrend = false; 

            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#0d1f33] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {kpi.label}
                  </span>
                  <span className={`material-symbols-outlined ${kpi.color} bg-current/10 p-2 rounded-xl text-xl`}>
                    {kpi.icon}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl 2xl:text-3xl font-black text-navy-dark dark:text-white tracking-tight">
                    {kpi.value}
                    {isRevenue && <span className="text-sm font-bold text-slate-400 ml-1">Kobo</span>}
                  </h3>
                </div>
                {hasTrend && (
                   <div className={cn("mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider", "text-emerald-500")}>
                     <span className="material-symbols-outlined text-xs">trending_up</span>
                     +0% <span className="font-bold text-slate-400 opacity-60 ml-0.5">vs average</span>
                   </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Operations Pipeline */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-navy-dark dark:text-white tracking-tight font-display uppercase">Order Management</h2>
            <div className="flex gap-3">
              <div className="relative group/filter">
                <button 
                  className="px-4 h-11 flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-500 hover:text-navy-dark dark:hover:text-white transition-all shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-xl">calendar_today</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {filter === "ALL" ? "All Time" : filter === "TODAY" ? "Today" : filter === "7D" ? "7 Days" : "30 Days"}
                  </span>
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#0d1f33] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl opacity-0 invisible group-hover/filter:opacity-100 group-hover/filter:visible transition-all z-[60] overflow-hidden">
                  {[
                    { id: "ALL", label: "All Time" },
                    { id: "TODAY", label: "Today" },
                    { id: "7D", label: "Last 7 Days" },
                    { id: "30D", label: "Last 30 Days" }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFilter(opt.id as any)}
                      className={cn(
                        "w-full px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                        filter === opt.id ? "text-primary bg-primary/5" : "text-slate-500"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => toast.info("Custom layout options coming soon!")}
                className="size-11 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-400 hover:text-navy-dark dark:hover:text-white transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">view_week</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar pb-10 -mx-4 px-4 sm:-mx-0 sm:px-0">
            <div className="flex gap-8 min-w-max">
              <KanbanColumn
                title="New Orders"
                count={newOrders.length}
                colorClass="bg-orange-500"
              >
                {newOrders.map((order: Order) => (
                  <KanbanOrderCard
                    key={order.id}
                    order={order}
                    onAction={handleOrderAction}
                  />
                ))}
                {newOrders.length < 2 && (
                  <KanbanOrderCard order={null as any} onAction={() => {}} />
                )}
              </KanbanColumn>

              <KanbanColumn
                title="Awaiting Shipping"
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
                  <KanbanOrderCard order={null as any} onAction={() => {}} />
                )}
              </KanbanColumn>

              <KanbanColumn
                title="In Transit"
                count={transitOrders.length}
                colorClass="bg-indigo-500"
              >
                {transitOrders.map((order: Order) => (
                  <KanbanOrderCard
                    key={order.id}
                    order={order}
                    onAction={handleOrderAction}
                  />
                ))}
                {transitOrders.length === 0 && (
                  <KanbanOrderCard order={null as any} onAction={() => {}} />
                )}
              </KanbanColumn>
            </div>
          </div>
        </section>

        {/* Trade History Section - Restored */}
        <section className="bg-white dark:bg-[#0d1f33] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-black text-navy-dark dark:text-white tracking-tight">Recent Transactions</h2>
            <Link 
              href="/merchant/orders" 
              className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-6 py-4">Order ID & Item</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest opacity-50">
                      No matching order records
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-navy-dark dark:text-white text-xs">#ORD-{order.id.slice(0, 4).toUpperCase()}</span>
                          <span className="text-[10px] font-medium text-slate-400 mt-0.5">{order.product?.name || "Materials Bulk"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-navy-dark dark:text-white text-xs">
                        {formatKobo(BigInt(order.totalAmountKobo))}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-[10px] font-bold uppercase">
                        {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
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
    </div>
  );
}
