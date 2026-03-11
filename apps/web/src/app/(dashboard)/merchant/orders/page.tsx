"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMerchantOrders } from "@/hooks/use-merchant-orders";
import { OrderStatus } from "@hardware-os/shared";
import type { Order } from "@hardware-os/shared";
import { formatKobo } from "@/lib/utils";
import { OrderDrawer } from "@/components/merchant/orders/order-drawer";
import { DispatchModal } from "@/components/merchant/orders/dispatch-modal";

type TabFilter =
  | "ALL"
  | "PENDING_PAYMENT"
  | "PAID"
  | "DISPATCHED"
  | "DELIVERED"
  | "DISPUTE";

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case OrderStatus.PAID:
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
          PAID
        </span>
      );
    case OrderStatus.DISPATCHED:
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
          DISPATCHED
        </span>
      );
    case OrderStatus.DELIVERED:
    case OrderStatus.COMPLETED:
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
          COMPLETED
        </span>
      );
    case OrderStatus.PENDING_PAYMENT:
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 uppercase">
          Awaiting Payment
        </span>
      );
    case OrderStatus.DISPUTE:
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
          DISPUTE
        </span>
      );
    case OrderStatus.CANCELLED:
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 line-through">
          CANCELLED
        </span>
      );
    default:
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200">
          {status}
        </span>
      );
  }
}

import { StatusBadge } from "@/components/ui/status-badge";

export default function MerchantOrdersPage() {
  const router = useRouter();
  const { orders, loading, error } = useMerchantOrders();
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [dispatchedOrder, setDispatchedOrder] = useState<Order | null>(null);

  // Compute counts
  const pendingCount = orders.filter(
    (o) => o.status === OrderStatus.PENDING_PAYMENT,
  ).length;
  const paidCount = orders.filter((o) => o.status === OrderStatus.PAID).length;
  const dispatchedCount = orders.filter(
    (o) => o.status === OrderStatus.DISPATCHED,
  ).length;
  const deliveredCount = orders.filter(
    (o) =>
      o.status === OrderStatus.DELIVERED || o.status === OrderStatus.COMPLETED,
  ).length;
  const disputeCount = orders.filter(
    (o) =>
      o.status === OrderStatus.DISPUTE || o.status === OrderStatus.CANCELLED,
  ).length;

  // Filter orders by active tab
  const filteredOrders = orders
    .filter((order) => {
      if (activeTab === "ALL") return true;
      if (activeTab === "DELIVERED")
        return (
          order.status === OrderStatus.DELIVERED ||
          order.status === OrderStatus.COMPLETED
        );
      if (activeTab === "DISPUTE")
        return (
          order.status === OrderStatus.DISPUTE ||
          order.status === OrderStatus.CANCELLED
        );
      return order.status === activeTab;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const tabs: { label: string; value: TabFilter; count?: number }[] = [
    { label: "All", value: "ALL" },
    {
      label: "Awaiting Payment",
      value: "PENDING_PAYMENT",
      count: pendingCount,
    },
    { label: "Paid", value: "PAID", count: paidCount },
    { label: "Dispatched", value: "DISPATCHED", count: dispatchedCount },
    { label: "Delivered", value: "DELIVERED", count: deliveredCount },
    { label: "Dispute", value: "DISPUTE", count: disputeCount },
  ];

  const handleDispatchSuccess = (order: Order) => {
    setSelectedOrderId(null);
    setDispatchedOrder(order);
  };

  if (loading) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-red-400">
              error
            </span>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight tracking-tight uppercase">Failed to load orders</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-1">{error}</p>
          </div>
          <button
            onClick={() => router.refresh()}
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Orders",
      value: orders.length,
      icon: "list_alt",
      color: "text-primary",
    },
    {
      label: "Awaiting Dispatch",
      value: paidCount,
      icon: "local_shipping",
      color: "text-amber-500",
      highlight: paidCount > 0
    },
    {
      label: "Disputes / Issues",
      value: filteredOrders.filter(o => o.status === OrderStatus.DISPUTE).length,
      icon: "report_problem",
      color: "text-rose-500",
    },
  ];

  return (
    <div className="h-full max-w-[1600px] mx-auto w-full p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto no-scrollbar">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-navy-dark text-white rounded-full text-[10px] font-black uppercase tracking-widest">
              Manager Console
            </span>
          </div>
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase font-display">
            Order Intelligence
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide">
            Track fulfillment, manage logistics, and handle payouts.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {kpis.slice(1).map((kpi, idx) => (
            <div
              key={idx}
              className={`hidden md:block border-l-4 ${kpi.highlight ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'} dark:bg-slate-900 px-5 py-2`}
            >
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {kpi.label}
              </p>
              <p className={`text-xl font-black tracking-tighter ${kpi.highlight ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-1 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${
                activeTab === tab.value
                  ? "bg-navy-dark text-white shadow-lg shadow-navy-dark/20"
                  : "text-slate-400 hover:text-navy-dark dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`size-4 flex items-center justify-center text-[8px] rounded-full ${
                    tab.value === "PAID" ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Spacious Data Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Order ID</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Value (₦)</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4 opacity-30 grayscale">
                        <span className="material-symbols-outlined text-6xl">inventory_2</span>
                        <p className="text-xs font-black uppercase tracking-widest">No matching records found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group cursor-pointer"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center font-black text-[10px] text-slate-400">
                            #{order.id.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-black text-navy-dark dark:text-white tracking-widest uppercase">
                            ORD-{order.id.slice(0, 6).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <StatusBadge status={order.status} className="w-fit" />
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="text-xs font-black text-navy-dark dark:text-white tabular-nums tracking-widest">
                          {formatKobo(
                            Number(order.totalAmountKobo) +
                              Number(order.deliveryFeeKobo),
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          {order.status === OrderStatus.PAID && (
                            <button
                              onClick={() => setSelectedOrderId(order.id)}
                              className="px-5 py-2 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
                            >
                              Dispatch
                            </button>
                          )}
                          <Link
                            href={`/merchant/orders/${order.id}`}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-navy-dark dark:hover:text-white"
                          >
                            <span className="material-symbols-outlined text-xl">open_in_new</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Context Sidebar Hint */}
        <div className="flex items-center gap-2 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
          <span className="material-symbols-outlined text-blue-500 text-lg">info</span>
          <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">
            Showing {filteredOrders.length} records. Click any row to view full details and print dispatch slips.
          </p>
        </div>
      </main>

      {/* Side Components */}
      {selectedOrderId && (
        <OrderDrawer
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onDispatchSuccess={handleDispatchSuccess}
        />
      )}

      {dispatchedOrder && (
        <DispatchModal
          order={dispatchedOrder}
          onClose={() => setDispatchedOrder(null)}
        />
      )}
    </div>
  );
}

