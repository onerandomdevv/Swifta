"use client";

import React, { useState } from "react";
import { Money } from "@/components/ui/money";
import { Skeleton } from "@/components/ui/skeleton";
import { useMerchantOrders } from "@/hooks/use-merchant-orders";

// Extracted Components
import {
  MerchantOrdersTable,
  OrderFilters,
  type MerchantOrderFilter,
} from "@/components/merchant/orders";

export default function MerchantOrdersPage() {
  const { orders, loading, error } = useMerchantOrders();
  const [activeTab, setActiveTab] = useState<MerchantOrderFilter>("ALL");

  if (loading) {
    return (
      <div className="space-y-8 py-8 px-4 md:px-10 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-[2.5rem]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <span className="material-symbols-outlined text-5xl text-red-400">
          error
        </span>
        <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
        >
          Retry
        </button>
      </div>
    );
  }

  const pendingCount = orders.filter(
    (o) => o.status === "PENDING_PAYMENT",
  ).length;
  const paidCount = orders.filter((o) => o.status === "PAID").length;
  const totalRevenue = orders
    .filter(
      (o) =>
        o.status !== "CANCELLED" &&
        o.status !== "PENDING_PAYMENT" &&
        o.status !== "DISPUTE",
    )
    .reduce((sum, o) => sum + BigInt(o.totalAmountKobo), 0n);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PENDING") return order.status === "PENDING_PAYMENT";
    if (activeTab === "DISPATCH_READY") return order.status === "PAID";
    if (activeTab === "COMPLETED")
      return order.status === "COMPLETED" || order.status === "DELIVERED";
    return true;
  });

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="flex-1 space-y-8 py-8 px-4 md:px-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
              Orders Management
            </h1>
            <p className="text-slate-500 font-bold text-sm tracking-wide mt-2 uppercase opacity-70">
              Manage and track your B2B hardware trades across Lagos districts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] p-5">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                Total Orders
              </p>
              <span className="material-symbols-outlined text-slate-900 dark:text-white text-sm">
                inventory_2
              </span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none tabular-nums">
              {orders.length}
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] p-5 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                Pending Payment
              </p>
              <span className="material-symbols-outlined text-slate-900 dark:text-white text-sm">
                pending_actions
              </span>
            </div>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none tabular-nums">
                {pendingCount}
              </h3>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange rounded text-[9px] font-black uppercase tracking-widest leading-none mb-1">
                  Alert
                </span>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] p-5">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                Ready to Dispatch
              </p>
              <span className="material-symbols-outlined text-slate-900 dark:text-white text-sm">
                local_shipping
              </span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none tabular-nums">
              {paidCount}
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] p-5">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                Total Revenue
              </p>
              <span className="material-symbols-outlined text-slate-900 dark:text-white text-sm">
                account_balance_wallet
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none truncate tabular-nums">
              <Money amount={totalRevenue} />
            </h3>
          </div>
        </div>

        <OrderFilters activeTab={activeTab} setActiveTab={setActiveTab} />
        <MerchantOrdersTable orders={filteredOrders} />
      </main>
    </div>
  );
}
