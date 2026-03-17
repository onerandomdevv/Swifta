"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMerchantOrders } from "@/hooks/use-merchant-orders";
import { OrderStatus } from "@swifta/shared";
import type { Order } from "@swifta/shared";
import { formatKobo } from "@/lib/utils";
import { OrderDrawer } from "@/components/merchant/orders/order-drawer";
import { DispatchModal } from "@/components/merchant/orders/dispatch-modal";
import { StatusBadge } from "@/components/ui/status-badge";

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

export default function MerchantOrdersPage() {
  const router = useRouter();
  const { orders, loading, error } = useMerchantOrders();
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [dispatchedOrder, setDispatchedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Compute counts
  const pendingCount = orders.filter((o) => o.status === OrderStatus.PENDING_PAYMENT).length;
  const paidCount = orders.filter((o) => o.status === OrderStatus.PAID).length;
  const dispatchedCount = orders.filter((o) => o.status === OrderStatus.DISPATCHED).length;
  const deliveredCount = orders.filter((o) => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.COMPLETED).length;
  const disputeCount = orders.filter((o) => o.status === OrderStatus.DISPUTE || o.status === OrderStatus.CANCELLED).length;

  // Filter orders by active tab and search query
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesTab = 
          activeTab === "ALL" || 
          (activeTab === "DELIVERED" && (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.COMPLETED)) ||
          (activeTab === "DISPUTE" && (order.status === OrderStatus.DISPUTE || order.status === OrderStatus.CANCELLED)) ||
          order.status === activeTab;
        
        const matchesSearch = 
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order.buyer?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, activeTab, searchQuery]);

  const tabs: { label: string; value: TabFilter; count?: number }[] = [
    { label: "All", value: "ALL" },
    { label: "Awaiting Payment", value: "PENDING_PAYMENT", count: pendingCount },
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
      <div className="h-full bg-slate-50 dark:bg-background-dark p-8 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initialising Terminal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-slate-50 dark:bg-background-dark p-8 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-red-500">terminal_error</span>
        </div>
        <div>
          <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">System Interrupt</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-1">{error}</p>
        </div>
        <button
          onClick={() => router.refresh()}
          className="px-8 py-3 bg-primary text-navy-dark rounded-xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 shadow-lg shadow-primary/20"
        >
          Re-establish Connection
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-300 p-8 pt-6">
      <div className="max-w-[1400px] mx-auto space-y-10">
        
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tighter uppercase font-display leading-none">
              Orders <span className="text-primary opacity-80">Intelligence</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm mt-2 tracking-wide">Real-time logistics and transaction tracking terminal</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-navy-dark border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">file_download</span>
              Export Analytics
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-primary text-navy-dark rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-xl shadow-primary/20 transition-all active:scale-95">
              <span className="material-symbols-outlined text-lg font-black">add</span>
              Initialize Order
            </button>
          </div>
        </header>

        {/* KPI Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Manifests", value: orders.length, color: "primary", icon: "reorder", trend: "+12.5%" },
            { label: "Awaiting Dispatch", value: paidCount, color: "orange-500", icon: "local_shipping", trend: "-5%" },
            { label: "Active Disputes", value: orders.filter(o => o.status === OrderStatus.DISPUTE).length, color: "red-500", icon: "warning", trend: "+1.2%" },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white dark:bg-navy-dark p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
              <div className={`absolute right-[-10px] top-[-10px] opacity-5 text-${kpi.color}`}>
                <span className="material-symbols-outlined text-8xl">{kpi.icon}</span>
              </div>
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{kpi.label}</p>
                  <h3 className="text-4xl font-black text-navy-dark dark:text-white tracking-tighter">{kpi.value.toLocaleString()}</h3>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-400`}>
                  Live Update
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Filters and Table Container */}
        <div className="bg-white dark:bg-navy-dark rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          {/* Tab Filters */}
          <div className="border-b border-slate-100 dark:border-slate-800 px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-8 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`py-6 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${
                    activeTab === tab.value
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-400 hover:text-navy-dark dark:hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`size-4 flex items-center justify-center text-[8px] rounded-full ${
                        activeTab === tab.value ? 'bg-primary text-navy-dark' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
            <div className="py-4 md:py-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-black leading-none pb-0.5">search</span>
                <input
                  type="text"
                  placeholder="Scan Manifests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-medium tracking-wide focus:ring-2 focus:ring-primary/20 focus:border-primary w-full md:w-80 outline-none transition-all dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          {/* Data Display */}
          <div className="overflow-x-auto">
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <div className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4 opacity-20 grayscale">
                    <span className="material-symbols-outlined text-6xl">inventory_2</span>
                    <p className="text-xs font-black uppercase tracking-widest leading-loose">No orders found</p>
                  </div>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-6 bg-white dark:bg-navy-dark active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ORD-{order.id.slice(0, 6).toUpperCase()}</p>
                        <h4 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-tight">
                          {order.buyer?.name || "Guest Procure"}
                        </h4>
                      </div>
                      <StatusBadge status={order.status} className="scale-90 origin-right" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Date</span>
                        <span className="text-[10px] font-bold text-slate-900 dark:text-white">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Settlement</span>
                        <span className="text-xs font-black text-primary tabular-nums tracking-widest">
                          {formatKobo(Number(order.totalAmountKobo) - Number(order.platformFeeKobo || 0))}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                      <Link
                        href={`/merchant/orders/${order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        Full Details <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </Link>
                      {order.status === OrderStatus.PAID && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(order.id);
                          }}
                          className="px-6 py-2 bg-primary text-navy-dark text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10 active:scale-95 transition-all"
                        >
                          Dispatch
                        </button>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Desktop Table View */}
            <table className="w-full text-left hidden md:table">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-50 dark:border-slate-800">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Terminal</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Settlement</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4 opacity-20 grayscale">
                        <span className="material-symbols-outlined text-6xl">inventory_2</span>
                        <p className="text-xs font-black uppercase tracking-widest leading-loose">No orders matching your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group cursor-pointer"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <td className="px-8 py-6">
                        <span className="text-xs font-black text-navy-dark dark:text-white tracking-widest uppercase">
                          ORD-{order.id.slice(0, 6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-navy-dark dark:bg-slate-800 flex items-center justify-center text-white font-black text-[10px] uppercase">
                            {(order.buyer?.name || "B").slice(0, 2)}
                          </div>
                          <span className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-tight truncate max-w-[180px]">
                            {order.buyer?.name || "Guest Procure"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <StatusBadge status={order.status} className="w-fit" />
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-xs font-black text-navy-dark dark:text-white tabular-nums tracking-widest">
                          {formatKobo(Number(order.totalAmountKobo) - Number(order.platformFeeKobo || 0))}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          {order.status === OrderStatus.PAID && (
                            <button
                              onClick={() => setSelectedOrderId(order.id)}
                              className="px-5 py-2 bg-primary text-navy-dark text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10 hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
                            >
                              Dispatch
                            </button>
                          )}
                          <Link
                            href={`/merchant/orders/${order.id}`}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-navy-dark dark:hover:text-white"
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

          {/* Context Footer */}
          <div className="px-8 py-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing {filteredOrders.length} of {orders.length} Manifestations
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-300 hover:text-primary transition-colors disabled:opacity-30" disabled>
                <span className="material-symbols-outlined rotate-180">arrow_forward</span>
              </button>
              <button className="size-8 flex items-center justify-center rounded-lg bg-navy-dark text-white text-[10px] font-black">1</button>
              <button className="p-2 text-slate-300 hover:text-primary transition-colors disabled:opacity-30" disabled>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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

