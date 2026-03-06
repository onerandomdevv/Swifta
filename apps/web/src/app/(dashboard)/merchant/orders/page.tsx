"use client";

import React, { useState } from "react";
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

export default function MerchantOrdersPage() {
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
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-4">
            error
          </span>
          <p className="text-red-500 font-bold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Merchant Orders Console
          </h2>
          <p className="text-sm text-slate-500">
            Logistics & Order Management Center
          </p>
        </div>
        <div className="flex gap-4">
          <div className="border-l-4 border-primary bg-slate-50 dark:bg-slate-800 px-5 py-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Active Orders
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {orders.length}
            </p>
          </div>
          <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/10 px-5 py-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Awaiting Dispatch
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-orange-500">{paidCount}</p>
              {paidCount > 0 && (
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-tighter">
                  (Action Required)
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden p-8">
        {/* Tab Filters */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.5 ${
                    tab.value === "PAID"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-auto">
          {filteredOrders.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Total (₦)
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <td className="px-6 py-4 text-xs text-slate-700 dark:text-slate-300">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-bold text-primary">
                      ORD-{order.id.slice(0, 6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                      {formatKobo(
                        Number(order.totalAmountKobo) +
                          Number(order.deliveryFeeKobo),
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {order.status === OrderStatus.PAID && (
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="bg-orange-500 text-white text-[10px] font-bold px-4 py-2 uppercase tracking-widest hover:bg-orange-600 transition-colors"
                        >
                          Dispatch
                        </button>
                      )}
                      {order.status === OrderStatus.DISPATCHED &&
                        order.deliveryOtp && (
                          <div className="inline-block bg-slate-100 dark:bg-slate-800 px-3 py-1.5 font-mono text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            OTP: {order.deliveryOtp}
                          </div>
                        )}
                      {(order.status === OrderStatus.COMPLETED ||
                        order.status === OrderStatus.DELIVERED) && (
                        <a
                          href={`/buyer/orders/${order.id}/receipt`}
                          className="text-primary text-[10px] font-bold uppercase tracking-widest underline decoration-2 underline-offset-4"
                        >
                          View Receipt
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">
                list_alt
              </span>
              <p className="text-slate-500 font-medium text-sm">
                No orders in this category.
              </p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="mt-4 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <p>
            Showing {filteredOrders.length} of {orders.length} Total Orders
          </p>
        </div>
      </main>

      {/* Order Details Side-Drawer */}
      {selectedOrderId && (
        <OrderDrawer
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onDispatchSuccess={handleDispatchSuccess}
        />
      )}

      {/* Dispatch Confirmation Modal */}
      {dispatchedOrder && (
        <DispatchModal
          order={dispatchedOrder}
          onClose={() => setDispatchedOrder(null)}
        />
      )}
    </div>
  );
}
