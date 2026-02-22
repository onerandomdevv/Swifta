"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Money } from "@/components/ui/money";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrders } from "@/lib/api/order.api";
import type { Order } from "@hardware-os/shared";

export default function MerchantOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<
    "ALL" | "PENDING" | "DISPATCH_READY" | "COMPLETED"
  >("ALL");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await getOrders();
        setOrders(response);
      } catch (err: any) {
        setError(err?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

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
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              Total Orders
            </p>
            <h3 className="text-3xl font-black text-navy-dark dark:text-white tracking-tight leading-none uppercase">
              {orders.length}
            </h3>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              Pending Payment
            </p>
            <h3 className="text-3xl font-black text-navy-dark dark:text-white tracking-tight leading-none uppercase">
              {pendingCount}
            </h3>
            {pendingCount > 0 && (
              <span className="mt-4 inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700">
                High Alert
              </span>
            )}
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              Ready for Dispatch
            </p>
            <h3 className="text-3xl font-black text-navy-dark dark:text-white tracking-tight leading-none uppercase">
              {paidCount}
            </h3>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              Total Revenue
            </p>
            <h3 className="text-3xl font-black text-navy-dark dark:text-white tracking-tight leading-none uppercase">
              <Money amount={totalRevenue} />
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto no-scrollbar">
          {(["ALL", "PENDING", "DISPATCH_READY", "COMPLETED"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? "border-navy-dark text-navy-dark dark:border-white dark:text-white" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
              >
                {tab.replace("_", " ")}
              </button>
            ),
          )}
        </div>

        {filteredOrders.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-navy-dark/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Order ID
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Order Date
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Amount
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Status
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300"
                    >
                      <td className="px-8 py-8">
                        <p className="text-sm font-black text-navy-dark dark:text-white uppercase leading-tight">
                          #{order.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-8 py-8">
                        <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-8 py-8">
                        <div className="text-sm font-black text-navy-dark dark:text-white tracking-tight">
                          <Money amount={BigInt(order.totalAmountKobo)} />
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <span
                          className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border h-7 ${
                            order.status === "PENDING_PAYMENT"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : order.status === "PAID"
                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                : order.status === "DISPATCHED"
                                  ? "bg-purple-50 text-purple-700 border-purple-100"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-100"
                          }`}
                        >
                          {order.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-8 py-8 text-right">
                        <Link
                          href={`/merchant/orders/${order.id}`}
                          className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-navy-dark dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all active:scale-95 inline-block"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-sm">
            <div className="size-24 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
              <span className="material-symbols-outlined text-4xl text-slate-200">
                inventory_2
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
                No Orders Yet
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Orders will appear here when buyers accept your quotes.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
