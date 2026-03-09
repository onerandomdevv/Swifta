"use client";

import React, { useState, useEffect } from "react";
import { formatKobo } from "@hardware-os/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrders } from "@/lib/api/order.api";
import { getAnalytics, MerchantAnalytics } from "@/lib/api/merchant.api";
import type { Order } from "@hardware-os/shared";

export default function MerchantAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<MerchantAnalytics | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [orderResponse, analyticsResponse] = await Promise.all([
          getOrders(1, 10), // We only need recent orders for the table
          getAnalytics(),
        ]);
        setOrders(orderResponse);
        setStats(analyticsResponse);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load analytics",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pipelineValue = stats ? BigInt(stats.pipelineValue) : 0n;
  const completedOrders = stats?.completedOrders || 0;
  const totalRfqs = stats?.totalRfqs || 0;
  const quotedRfqs = stats?.quotedRfqs || 0;
  const acceptanceRate = stats?.acceptanceRate || 0;

  const kpis = [
    {
      label: "Pipeline Value",
      value: formatKobo(pipelineValue),
      trend: `${stats?.totalOrders || 0} orders`,
      trendType: "up",
      subtext: "Total order value",
      icon: "info",
    },
    {
      label: "Acceptance Rate",
      value: `${acceptanceRate}%`,
      trend: `${completedOrders}/${totalRfqs}`,
      trendType: "up",
      subtext: "Completed vs RFQs",
      icon: "query_stats",
    },
    {
      label: "Open RFQs",
      value: `${stats?.openRfqs || 0}`,
      trend: `${quotedRfqs} quoted`,
      trendType: "up",
      subtext: "Awaiting response",
      icon: "timer",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
          </div>
          <aside className="space-y-8">
            <Skeleton className="h-64 w-full rounded-[2.5rem]" />
          </aside>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400 mb-4">
          error
        </span>
        <p className="text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
            Merchant Analytics
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide">
            Performance metrics and trade historical insights.
          </p>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {kpi.label}
              </p>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-primary-navy transition-colors">
                {kpi.icon}
              </span>
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-navy-dark dark:text-white tracking-tight leading-none uppercase">
                {kpi.value}
              </h3>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base font-bold text-emerald-500">
                  trending_up
                </span>
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500">
                  {kpi.trend}{" "}
                  <span className="text-slate-400 font-bold ml-1 tracking-tight lowercase">
                    {kpi.subtext}
                  </span>
                </p>
              </div>
            </div>
            {kpi.label === "Acceptance Rate" && (
              <div className="mt-8 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="bg-primary-navy h-full rounded-full"
                  style={{ width: `${acceptanceRate}%` }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <main className="lg:col-span-2 space-y-8">
          {/* Trade History Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-navy-dark/5 overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800">
              <h3 className="text-xl font-black text-navy-dark dark:text-white tracking-tight uppercase">
                Order History
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Order ID
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                      Value
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Date
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-8 py-12 text-center text-slate-400 text-sm font-bold uppercase tracking-widest"
                      >
                        No orders yet
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 10).map((order) => (
                      <tr
                        key={order.id}
                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300"
                      >
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-navy-dark dark:text-white leading-tight">
                            #{order.id.slice(0, 8)}
                          </p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <p className="text-sm font-black text-navy-dark dark:text-white tracking-tight">
                            {formatKobo(BigInt(order.totalAmountKobo))}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <aside className="space-y-8 sticky top-24">
          <div className="bg-[#f0f7ff] dark:bg-blue-950/20 border-2 border-[#2e75b6] dark:border-blue-500/30 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 text-[#2e75b6]/10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
              <span className="material-symbols-outlined text-[160px]">
                lightbulb
              </span>
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-md shadow-blue-500/10">
                  <span className="material-symbols-outlined text-[#2e75b6] font-black">
                    lightbulb
                  </span>
                </div>
                <h4 className="text-navy-dark dark:text-white font-black text-sm uppercase tracking-widest leading-tight">
                  Pro-Tip: Boost Conversions
                </h4>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs font-bold leading-relaxed">
                Merchants who respond within{" "}
                <span className="text-[#2e75b6] font-black uppercase">
                  1 hour
                </span>{" "}
                have a{" "}
                <span className="text-[#2e75b6] font-black">
                  35% higher acceptance rate
                </span>
                . Try reducing your lead time today.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary-navy font-black">
                analytics
              </span>
              <h4 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
                Summary
              </h4>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Total Orders</span>
                <span className="text-navy-dark dark:text-white">
                  {orders.length}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Completed</span>
                <span className="text-emerald-500">{completedOrders}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Total RFQs</span>
                <span className="text-navy-dark dark:text-white">
                  {totalRfqs}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Revenue</span>
                <span className="text-navy-dark dark:text-white">
                  {formatKobo(pipelineValue)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
