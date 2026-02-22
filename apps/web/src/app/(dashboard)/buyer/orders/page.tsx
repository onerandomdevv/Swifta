"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatKobo } from "@hardware-os/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrders } from "@/lib/api/order.api";
import type { Order } from "@hardware-os/shared";

export default function BuyerOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

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
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />
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
  const completedCount = orders.filter(
    (o) => o.status === "COMPLETED" || o.status === "DELIVERED",
  ).length;

  return (
    <div className="space-y-10 py-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
            Order History
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
            Manage your hardware procurement across all merchants in Lagos.
          </p>
        </div>
        <Link
          href="/buyer/catalogue"
          className="flex items-center gap-2 px-6 py-3 bg-navy-dark text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-navy-dark/20 hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Procurement
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
            Total Orders
          </p>
          <h3 className="text-3xl font-black text-navy-dark dark:text-white tracking-tighter uppercase leading-none">
            {orders.length}
          </h3>
        </div>
        <div
          className={`bg-white dark:bg-slate-900 rounded-[2rem] p-8 border shadow-sm ${pendingCount > 0 ? "border-amber-200 dark:border-amber-900/40 border-l-4" : "border-slate-100 dark:border-slate-800"}`}
        >
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
            Pending Payment
          </p>
          <h3 className="text-3xl font-black text-navy-dark dark:text-white tracking-tighter uppercase leading-none">
            {pendingCount}
          </h3>
          {pendingCount > 0 && (
            <span className="mt-4 inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-amber-50 text-amber-600 border-amber-100">
              Action required
            </span>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
            Completed
          </p>
          <h3 className="text-3xl font-black text-navy-dark dark:text-white tracking-tighter uppercase leading-none">
            {completedCount}
          </h3>
        </div>
      </div>

      {orders.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-navy-dark/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Order ID
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Date
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Total Amount
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Status
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300"
                  >
                    <td className="px-8 py-7">
                      <p className="text-sm font-black text-navy-dark dark:text-white leading-tight">
                        #{order.id.slice(0, 8)}
                      </p>
                    </td>
                    <td className="px-8 py-7">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-8 py-7">
                      <p className="text-sm font-black text-navy-dark dark:text-white tracking-tight">
                        {formatKobo(BigInt(order.totalAmountKobo))}
                      </p>
                    </td>
                    <td className="px-8 py-7">
                      <span
                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          order.status === "PENDING_PAYMENT"
                            ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10"
                            : order.status === "PAID"
                              ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10"
                              : order.status === "DISPATCHED"
                                ? "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/10"
                                : order.status === "COMPLETED" ||
                                    order.status === "DELIVERED"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10"
                                  : "bg-slate-50 text-slate-600 border-slate-100"
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-8 py-7 text-right">
                      <Link
                        href={`/buyer/orders/${order.id}`}
                        className="px-6 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-navy-dark dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all active:scale-95 inline-block"
                      >
                        View
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
              shopping_cart
            </span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
              No Orders Yet
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Your order history will appear here after accepting a quote.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
