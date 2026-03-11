"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatKobo } from "@hardware-os/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useBuyerOrders } from "@/hooks/use-buyer-orders";
import type { Order } from "@hardware-os/shared";

const STATUS_TABS = [
  { label: "All", value: "ALL", icon: "list" },
  { label: "Pending", value: "PENDING_PAYMENT", icon: "schedule" },
  { label: "Paid", value: "PAID", icon: "check_circle" },
  { label: "Dispatched", value: "DISPATCHED", icon: "local_shipping" },
  { label: "Delivered", value: "DELIVERED", icon: "package_2" },
  { label: "Completed", value: "COMPLETED", icon: "verified" },
  { label: "Cancelled", value: "CANCELLED", icon: "cancel" },
];

function getStatusConfig(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return { bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: "schedule", label: "Pending Payment" };
    case "PAID":
      return { bg: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: "check_circle", label: "Paid" };
    case "DISPATCHED":
      return { bg: "bg-indigo-50 dark:bg-indigo-900/10", border: "border-indigo-200", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", icon: "local_shipping", label: "Dispatched" };
    case "DELIVERED":
      return { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "package_2", label: "Delivered" };
    case "COMPLETED":
      return { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "verified", label: "Completed" };
    case "CANCELLED":
      return { bg: "bg-red-50 dark:bg-red-900/10", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: "cancel", label: "Cancelled" };
    case "DISPUTE":
      return { bg: "bg-red-50 dark:bg-red-900/10", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: "gavel", label: "Dispute" };
    default:
      return { bg: "bg-slate-50 dark:bg-slate-800/10", border: "border-slate-200", text: "text-slate-700", badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400", icon: "help", label: status };
  }
}

function OrdersPageSkeleton() {
  return (
    <div className="flex-1 flex flex-col font-display min-h-full space-y-8 p-4 md:p-10">
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-10 w-64 rounded-2xl" />
        </div>
        <Skeleton className="h-14 w-40 rounded-2xl" />
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-[2.5rem]" />
        ))}
      </div>
      <div className="space-y-4">
         {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function BuyerOrdersPage() {
  const { orders, loading, error, refetch } = useBuyerOrders();
  const [activeTab, setActiveTab] = useState("ALL");

  if (loading) return <OrdersPageSkeleton />;

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 text-center space-y-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-[2rem] bg-red-50 dark:bg-red-950/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-red-500">cloud_off</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Signal Interrupted</h3>
          <p className="text-sm text-slate-500 font-bold">{error}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-8 py-3 bg-navy-dark dark:bg-white text-white dark:text-navy-dark rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-xl shadow-navy-dark/10"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Retry Connection
        </button>
      </div>
    );
  }

  const activeCount = orders.filter((o) => ["PAID", "DISPATCHED", "PENDING_PAYMENT"].includes(o.status)).length;
  const completedCount = orders.filter((o) => ["COMPLETED", "DELIVERED"].includes(o.status)).length;

  const filteredOrders =
    activeTab === "ALL" ? orders : orders.filter((o) => o.status === activeTab);

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] ml-1">Orders Terminal</p>
          <h1 className="text-4xl md:text-5xl font-black text-navy-dark dark:text-white tracking-tighter uppercase font-display leading-none">
            Manifest <span className="text-primary opacity-80">History</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm">Track and manage your industrial procurement manifest records.</p>
        </div>
        <Link
          href="/buyer/catalogue"
          className="px-8 py-4 bg-navy-dark dark:bg-primary text-white dark:text-navy-dark rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-navy-dark/20 dark:shadow-primary/10 flex items-center gap-3 transition-all hover:-translate-y-1 active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          New Procurement
        </Link>
      </header>

      <main className="space-y-12">
        {/* ─── Summary Stats ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm group hover:border-primary transition-all duration-500">
            <div className="flex justify-between items-start mb-4">
               <div className="size-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-xl">inventory_2</span>
               </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Total Manifests</p>
            <p className="text-4xl font-black text-navy-dark dark:text-white tracking-tighter mt-1">{orders.length}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm group hover:border-amber-500 transition-all duration-500">
            <div className="flex justify-between items-start mb-4">
               <div className="size-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                  <span className="material-symbols-outlined text-xl">pending_actions</span>
               </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">In Execution</p>
            <p className="text-4xl font-black text-navy-dark dark:text-white tracking-tighter mt-1">{activeCount}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm group hover:border-emerald-500 transition-all duration-500">
            <div className="flex justify-between items-start mb-4">
               <div className="size-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                  <span className="material-symbols-outlined text-xl">task_alt</span>
               </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Completed</p>
            <p className="text-4xl font-black text-emerald-500 tracking-tighter mt-1">{completedCount}</p>
          </div>
        </div>

        {/* ─── Filter Tabs (scrollable) ─── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex gap-2 min-w-max p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            {STATUS_TABS.map((tab) => {
              const count =
                tab.value === "ALL"
                  ? orders.length
                  : orders.filter((o) => o.status === tab.value).length;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-5 py-2.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.value
                      ? "bg-white dark:bg-slate-800 text-navy-dark dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-none translate-y-[-1px]"
                      : "text-slate-400 hover:text-navy-dark dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                  {tab.label}
                  {count > 0 && (
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ml-1 ${
                      activeTab === tab.value
                        ? "bg-primary text-white"
                        : "bg-slate-200/50 dark:bg-white/10 text-slate-400"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Orders List ─── */}
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order: Order) => {
              const config = getStatusConfig(order.status);
              const date = new Date(order.createdAt).toLocaleDateString("en-NG", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const merchantName = order.merchant?.businessName || order.merchant?.companyName || "Industrial Merchant";

              return (
                <Link
                  key={order.id}
                  href={`/buyer/orders/${order.id}`}
                  className="group block bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 sm:p-8 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/30 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-2xl hover:shadow-slate-200/40 relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                       <div className={`size-16 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-500 group-hover:scale-110 ${config.bg} ${config.border} ${config.text}`}>
                          <span className="material-symbols-outlined text-3xl">{config.icon}</span>
                       </div>
                       <div className="min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{order.id.slice(0, 8).toUpperCase()}</p>
                             <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shrink-0 ${config.badge}`}>
                                {config.label}
                             </div>
                          </div>
                          <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight truncate leading-tight">{merchantName}</h3>
                          <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-2">
                             <span className="material-symbols-outlined text-sm">calendar_today</span>
                             {date}
                          </p>
                       </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-10 md:text-right">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Settlement</p>
                          <p className="text-2xl font-black text-navy-dark dark:text-white tracking-tighter">{formatKobo(BigInt(order.totalAmountKobo))}</p>
                       </div>
                       <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-primary/10 transition-all group-hover:translate-x-1">
                          <span className="material-symbols-outlined">chevron_right</span>
                       </div>
                    </div>
                  </div>

                  {/* Visual accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary transition-all duration-500" />
                </Link>
              );
            })}
          </div>
        ) : (
          /* ─── Empty State ─── */
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 animate-in zoom-in-95 duration-700">
            <div className="size-32 rounded-[3.5rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-5xl text-slate-200">
                {activeTab === "ALL" ? "shopping_bag" : "filter_list_off"}
              </span>
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-navy-dark dark:text-white uppercase tracking-tighter">
                {activeTab === "ALL" ? "Terminal Idle" : "No Match Found"}
              </h3>
              <p className="text-slate-500 font-bold max-w-xs mx-auto leading-relaxed">
                {activeTab === "ALL"
                  ? "No procurement records found for your account. Initialize your first industrial order to see records here."
                  : "No manifests found under this protocol filter. Adjust your parameters."}
              </p>
            </div>
            {activeTab === "ALL" && (
              <Link
                href="/buyer/catalogue"
                className="px-10 py-5 bg-navy-dark dark:bg-white text-white dark:text-navy-dark rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-navy-dark/10"
              >
                <span className="material-symbols-outlined text-lg">storefront</span>
                Explore Market
              </Link>
            )}
          </div>
        )}
      </main>
      
      <div className="h-20" />
    </div>
  );
}
