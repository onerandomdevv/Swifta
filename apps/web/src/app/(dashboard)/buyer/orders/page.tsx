"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatKobo } from "@hardware-os/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useBuyerOrders } from "@/hooks/use-buyer-orders";
import type { Order } from "@hardware-os/shared";

const STATUS_TABS = [
  { label: "All", value: "ALL" },
  { label: "Pending Payment", value: "PENDING_PAYMENT" },
  { label: "Paid", value: "PAID" },
  { label: "Dispatched", value: "DISPATCHED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "bg-amber-100 text-amber-800";
    case "PAID":
      return "bg-blue-100 text-blue-800";
    case "DISPATCHED":
      return "bg-indigo-100 text-indigo-800";
    case "DELIVERED":
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    case "DISPUTE":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

function OrdersPageSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-12 w-48 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded" />
        ))}
      </div>

      <div className="flex gap-4 border-b border-primary/10 pb-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>

      <div className="space-y-1 border border-primary/10 rounded overflow-hidden">
        <Skeleton className="h-12 w-full rounded-none" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}

export default function BuyerOrdersPage() {
  const { orders, loading, error } = useBuyerOrders();
  const [activeTab, setActiveTab] = useState("ALL");

  if (loading) return <OrdersPageSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <p className="text-sm font-bold text-red-600 uppercase tracking-wide">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-white rounded font-bold uppercase tracking-wide"
        >
          Retry
        </button>
      </div>
    );
  }

  const pendingCount = orders.filter((o) => o.status === "PENDING_PAYMENT").length;
  const completedCount = orders.filter(
    (o) => o.status === "COMPLETED" || o.status === "DELIVERED"
  ).length;

  const filteredOrders =
    activeTab === "ALL"
      ? orders
      : orders.filter((o) => o.status === activeTab);

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col font-display bg-[#f8f6f5] min-h-full">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-primary text-xs font-bold tracking-widest uppercase mb-1">
            PROCUREMENT PIPELINE • ORDER TRACKING
          </p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">
            ACTIVE ORDERS
          </h1>
        </div>
        <Link
          href="/buyer/catalogue"
          className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded font-bold flex items-center justify-center gap-2 transition-colors uppercase text-sm tracking-wide"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          NEW PROCUREMENT
        </Link>
      </header>

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-primary/10 p-6 flex flex-col gap-1">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            TOTAL ORDERS
          </p>
          <p className="text-4xl font-bold text-slate-900">{orders.length}</p>
        </div>
        <div className="bg-white border border-primary/20 p-6 flex flex-col gap-1 relative">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            PENDING PAYMENT
          </p>
          <p className="text-4xl font-bold text-slate-900">{pendingCount}</p>
          {pendingCount > 0 && (
            <span className="absolute top-4 right-4 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
              ACTION REQUIRED
            </span>
          )}
        </div>
        <div className="bg-white border border-primary/10 p-6 flex flex-col gap-1">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            COMPLETED
          </p>
          <p className="text-4xl font-bold text-slate-900">{completedCount}</p>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex border-b border-primary/10 min-w-max">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-sm transition-colors ${
                activeTab === tab.value
                  ? "border-b-2 border-primary text-primary font-bold"
                  : "text-slate-500 font-medium hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table Container */}
      {filteredOrders.length > 0 ? (
        <div className="bg-white border border-primary/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary/5 text-slate-500 text-[11px] font-bold uppercase tracking-widest border-b border-primary/10">
                  <th className="px-6 py-4 whitespace-nowrap">Order ID</th>
                  <th className="px-6 py-4 whitespace-nowrap">Date</th>
                  <th className="px-6 py-4 whitespace-nowrap">Total Amount</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {filteredOrders.map((order: Order) => (
                  <tr key={order.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-sm text-slate-700 whitespace-nowrap">
                      #LAG-{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-700 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatKobo(BigInt(order.totalAmountKobo))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusBadgeClasses(
                          order.status
                        )}`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/buyer/orders/${order.id}`}
                        className="text-primary font-bold text-xs uppercase tracking-widest hover:underline decoration-1 underline-offset-4"
                      >
                        VIEW
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 bg-white border border-primary/10 rounded shadow-sm">
          <span className="material-symbols-outlined text-6xl text-slate-300">
            shopping_cart
          </span>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">
              No Orders Yet
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              Your order history will appear here after accepting a quote.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
