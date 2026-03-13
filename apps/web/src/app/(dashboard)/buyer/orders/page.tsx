"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBuyerOrders } from "@/hooks/use-buyer-orders";
import type { Order } from "@hardware-os/shared";
import { formatKobo } from "@/lib/utils";

type TabFilter = "ALL" | "ACTIVE" | "PENDING" | "COMPLETED" | "DISPUTED";

function getStatusDisplay(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return { label: "Pending Approval", icon: "schedule", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", iconBg: "bg-slate-100 dark:bg-slate-800", iconColor: "text-slate-500" };
    case "PAID":
      return { label: "Confirmed", icon: "check_circle", bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", iconBg: "bg-blue-50 dark:bg-blue-900/20", iconColor: "text-blue-600" };
    case "PREPARING":
      return { label: "In Preparation", icon: "manufacturing", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", iconBg: "bg-amber-50 dark:bg-amber-900/20", iconColor: "text-amber-600" };
    case "DISPATCHED":
    case "IN_TRANSIT":
      return { label: "In Execution", icon: "sync", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", iconBg: "bg-amber-50 dark:bg-amber-900/20", iconColor: "text-amber-600" };
    case "DELIVERED":
      return { label: "Out for Delivery", icon: "local_shipping", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", iconBg: "bg-amber-50 dark:bg-amber-900/20", iconColor: "text-amber-600" };
    case "COMPLETED":
      return { label: "Completed", icon: "verified", bg: "bg-primary/10", text: "text-primary", iconBg: "bg-primary/10", iconColor: "text-primary" };
    case "CANCELLED":
      return { label: "Cancelled", icon: "cancel", bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", iconBg: "bg-red-50 dark:bg-red-900/20", iconColor: "text-red-600" };
    case "DISPUTE":
      return { label: "Disputed", icon: "gavel", bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", iconBg: "bg-red-50 dark:bg-red-900/20", iconColor: "text-red-600" };
    default:
      return { label: status, icon: "help", bg: "bg-slate-100", text: "text-slate-600", iconBg: "bg-slate-100", iconColor: "text-slate-500" };
  }
}

function getSecondaryAction(status: string): { label: string; icon: string } | null {
  switch (status) {
    case "DISPATCHED":
    case "IN_TRANSIT":
    case "DELIVERED":
      return { label: "Track", icon: "pin_drop" };
    case "COMPLETED":
      return { label: "Invoice", icon: "receipt_long" };
    case "PENDING_PAYMENT":
      return { label: "Cancel", icon: "close" };
    default:
      return null;
  }
}

export default function BuyerOrdersPage() {
  const router = useRouter();
  const { orders, loading, error, refetch } = useBuyerOrders();
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Compute counts
  const totalCount = orders.length;
  const activeCount = orders.filter((o) => ["PAID", "PREPARING", "DISPATCHED", "IN_TRANSIT", "DELIVERED"].includes(o.status)).length;
  const completedCount = orders.filter((o) => ["COMPLETED"].includes(o.status)).length;

  // Filter orders
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
      <div className="h-full bg-background-light dark:bg-background-dark p-8 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-background-light dark:bg-background-dark p-8 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-red-500">cloud_off</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Connection Error</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-1">{error}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm transition-all hover:bg-emerald-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display text-slate-900 dark:text-slate-100">
      <main className="max-w-7xl mx-auto w-full px-6 md:px-10 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Buyer Orders</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and track your industrial supply shipments.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <span className="material-symbols-outlined">description</span>
              </div>
              {totalCount > 0 && (
                <span className="text-primary text-sm font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">trending_up</span> {totalCount}
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Manifests</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalCount}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                <span className="material-symbols-outlined">local_shipping</span>
              </div>
              {activeCount > 0 && (
                <span className="text-amber-500 text-sm font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">sync</span> {activeCount}
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">In Execution</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{activeCount}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <span className="material-symbols-outlined">task_alt</span>
              </div>
              {completedCount > 0 && (
                <span className="text-primary text-sm font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">trending_up</span> {completedCount}
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Completed</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{completedCount}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                activeTab === tab.value
                  ? "text-primary font-bold border-b-2 border-primary"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Grid List */}
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order: Order) => {
              const config = getStatusDisplay(order.status);
              const date = new Date(order.createdAt).toLocaleDateString("en-NG", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const merchantName = order.merchant?.businessName || order.merchant?.companyName || "Industrial Merchant";
              const secondaryAction = getSecondaryAction(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-shadow group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`size-16 rounded-xl flex items-center justify-center ${config.iconBg} ${config.iconColor}`}>
                        <span className="material-symbols-outlined text-3xl">{config.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${config.bg} ${config.text}`}>
                            {config.label}
                          </span>
                          <span className="text-slate-400 text-xs font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{merchantName}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                            <span className="material-symbols-outlined text-base">calendar_today</span> {date}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                            <span className="material-symbols-outlined text-base">payments</span> {formatKobo(order.totalAmountKobo)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      {secondaryAction && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/buyer/orders/${order.id}`);
                          }}
                          className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                        >
                          {secondaryAction.label}
                        </button>
                      )}
                      <Link
                        href={`/buyer/orders/${order.id}`}
                        className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-emerald-600 rounded-lg transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
            <div className="size-24 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-5xl text-slate-300">
                {activeTab === "ALL" ? "shopping_bag" : "filter_list_off"}
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {activeTab === "ALL" ? "No Orders Yet" : "No Matching Orders"}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {activeTab === "ALL"
                  ? "You haven't placed any orders yet. Start exploring the marketplace to place your first order."
                  : "No orders match this filter. Try a different category."}
              </p>
            </div>
            {activeTab === "ALL" && (
              <Link
                href="/buyer/catalogue"
                className="px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">storefront</span>
                Explore Marketplace
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing 1-{filteredOrders.length} of {filteredOrders.length} orders
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="size-10 bg-primary text-white font-bold rounded-lg">1</button>
              <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-10 px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="font-bold">SwiftTrade Industrial</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500 dark:text-slate-400">
            <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-colors" href="#">Contact Support</a>
          </div>
          <p className="text-sm text-slate-400">© 2026 SwiftTrade Solutions Inc.</p>
        </div>
      </footer>
    </div>
  );
}
