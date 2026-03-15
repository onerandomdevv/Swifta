"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBuyerOrders } from "@/hooks/use-buyer-orders";
import type { Order } from "@swifta/shared";
import { formatKobo } from "@/lib/utils";

type TabFilter = "ALL" | "ACTIVE" | "PENDING" | "COMPLETED" | "DISPUTED";

interface OrdersViewProps {
  title?: string;
  subtitle?: string;
  orderDetailPrefix?: string;
  catalogueHref?: string;
}

function getStatusDisplay(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return { label: "Awaiting Payment", icon: "schedule", bg: "bg-slate-100", text: "text-slate-600", iconBg: "bg-slate-100", iconColor: "text-slate-500" };
    case "PAID":
      return { label: "Payment Confirmed", icon: "check_circle", bg: "bg-blue-100", text: "text-blue-700", iconBg: "bg-blue-50", iconColor: "text-blue-600" };
    case "PREPARING":
      return { label: "In Preparation", icon: "description", bg: "bg-blue-100", text: "text-blue-700", iconBg: "bg-blue-50", iconColor: "text-blue-600" };
    case "DISPATCHED":
    case "IN_TRANSIT":
      return { label: "Processing", icon: "sync", bg: "bg-amber-100", text: "text-amber-700", iconBg: "bg-amber-50", iconColor: "text-amber-600" };
    case "DELIVERED":
      return { label: "In Transit", icon: "local_shipping", bg: "bg-amber-100", text: "text-amber-700", iconBg: "bg-amber-50", iconColor: "text-amber-600" };
    case "COMPLETED":
      return { label: "Delivered", icon: "verified", bg: "bg-primary/10", text: "text-primary", iconBg: "bg-primary/10", iconColor: "text-primary" };
    case "CANCELLED":
    case "DISPUTE":
      return { label: "Issue Reported", icon: "report", bg: "bg-red-100", text: "text-red-700", iconBg: "bg-red-50", iconColor: "text-red-600" };
    default:
      return { label: status, icon: "help", bg: "bg-slate-100", text: "text-slate-600", iconBg: "bg-slate-100", iconColor: "text-slate-500" };
  }
}

function getSecondaryAction(status: string): { label: string; icon: string } | null {
  switch (status) {
    case "DISPATCHED":
    case "IN_TRANSIT":
    case "DELIVERED":
      return { label: "Track Order", icon: "local_shipping" };
    case "PREPARING":
    case "PAID":
      return { label: "Download Invoice", icon: "description" };
    case "COMPLETED":
      return { label: "Reorder", icon: "verified" };
    case "PENDING_PAYMENT":
      return { label: "Cancel", icon: "close" };
    default:
      return null;
  }
}

export function OrdersView({
  title = "My Orders",
  subtitle = "Manage and track your recent purchases.",
  orderDetailPrefix = "/buyer/orders",
  catalogueHref = "/buyer/catalogue"
}: OrdersViewProps) {
  const router = useRouter();
  const { orders, loading, error, refetch } = useBuyerOrders();
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesTab =
          activeTab === "ALL" ||
          (activeTab === "ACTIVE" && ["PAID", "PREPARING", "DISPATCHED", "IN_TRANSIT", "DELIVERED"].includes(order.status)) ||
          (activeTab === "PENDING" && order.status === "PENDING_PAYMENT") ||
          (activeTab === "COMPLETED" && order.status === "COMPLETED") ||
          (activeTab === "DISPUTED" && (order.status === "DISPUTE" || order.status === "CANCELLED"));

        const matchesSearch =
          !searchQuery ||
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order.merchant?.businessName || "").toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, activeTab, searchQuery]);

  const tabs: { label: string; value: TabFilter }[] = [
    { label: "All Orders", value: "ALL" },
    { label: "Active", value: "ACTIVE" },
    { label: "Pending", value: "PENDING" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Disputed", value: "DISPUTED" },
  ];

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center space-y-4">
        <h3 className="text-lg font-bold">Failed to load orders</h3>
        <p className="text-slate-500 text-sm">{error}</p>
        <button onClick={() => refetch()} className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
        <p className="text-slate-500 text-sm">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 gap-4">
          <div className="flex overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === tab.value
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-100">
              <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 text-xs w-40 text-slate-700" 
                placeholder="Search orders..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order: Order) => {
              const config = getStatusDisplay(order.status);
              const secondaryAction = getSecondaryAction(order.status);
              const date = new Date(order.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div key={order.id} className="bg-white border border-slate-100 rounded-3xl p-5 hover:border-slate-200 transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`size-14 flex-shrink-0 flex items-center justify-center rounded-2xl ${config.iconBg} ${config.iconColor}`}>
                        <span className="material-symbols-outlined text-2xl">{config.icon}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">{order.merchant?.businessName || "Merchant"}</h3>
                          <span className={`${config.bg} ${config.text} text-[8px] font-black px-1.5 py-0.5 rounded uppercase`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1 font-mono">{formatKobo(order.totalAmountKobo)}</span>
                          <span>•</span>
                          <span>{date}</span>
                          <span>•</span>
                          <span className="uppercase tracking-tighter">ID: #{order.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`${orderDetailPrefix}/${order.id}`}
                        className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                      >
                        Details
                      </Link>
                      {secondaryAction && (
                        <button className="px-5 py-2.5 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all">
                          {secondaryAction.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-4xl text-slate-200 mb-4">inventory_2</span>
              <h3 className="text-lg font-bold text-slate-900">No orders found</h3>
              <p className="text-slate-500 text-sm mt-1 mb-8">You haven&apos;t placed any orders matching this filter.</p>
              <Link href={catalogueHref} className="bg-primary text-white font-black px-8 py-3 rounded-xl text-xs uppercase tracking-widest shadow-xl shadow-primary/10">Browse Marketplace</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
