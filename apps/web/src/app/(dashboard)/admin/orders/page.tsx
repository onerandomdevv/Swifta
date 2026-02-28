"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/providers/toast-provider";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

interface AdminOrder {
  id: string;
  totalAmountKobo: number;
  status: string;
  createdAt: string;
  merchant: {
    businessName: string;
  };
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  quote: {
    rfq: {
      quantity: number;
      product: {
        name: string;
        unit: string;
      };
    };
  };
}

const ORDER_STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  PENDING_PAYMENT: {
    label: "Awaiting Fund",
    color: "bg-slate-100 text-slate-600",
    icon: "schedule",
  },
  PAID: {
    label: "Paid / Processing",
    color: "bg-blue-50 text-blue-600",
    icon: "payments",
  },
  DISPATCHED: {
    label: "In Transit",
    color: "bg-orange-50 text-orange-600",
    icon: "local_shipping",
  },
  DELIVERED: {
    label: "Delivered",
    color: "bg-green-50 text-green-600",
    icon: "task_alt",
  },
  REFUNDED: {
    label: "Refunded",
    color: "bg-red-50 text-red-600",
    icon: "undo",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-slate-100 text-slate-500",
    icon: "block",
  },
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<string>("");

  const { data: orders, isLoading } = useQuery<AdminOrder[]>({
    queryKey: ["admin", "orders", "all"],
    queryFn: () => apiClient.get("/admin/orders"),
  });

  const forceResolveMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      apiClient.patch(`/admin/orders/${orderId}/force-resolve`, { status }),
    onSuccess: () => {
      toast.success("Order status manually overridden successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to override order status.");
    },
  });

  const handleForceResolve = () => {
    if (!selectedOrder || !overrideStatus) return;
    if (
      confirm(
        `Are you absolutely sure you want to forcibly transition Order #${selectedOrder.id.slice(0, 8)} to ${overrideStatus}? This violates natural transactional flow.`,
      )
    ) {
      forceResolveMutation.mutate({
        orderId: selectedOrder.id,
        status: overrideStatus,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-neon-cyan">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in mt-4 fade-in slide-in-from-bottom-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-navy-dark dark:text-white uppercase tracking-widest">
            Global Order Audit
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">
            Monitor, Trace, and Resolve Transaction Disputes
          </p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 rounded-xl text-sm border-2 border-slate-200 dark:border-slate-700">
          <span className="mr-2">Total System Load:</span>
          {orders?.length || 0}
        </div>
      </header>

      {/* Main Table View */}
      <section className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden">
        {orders && orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-100 dark:border-slate-800">
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Order ID
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Participants
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Goods
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Financials
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Global State
                  </th>
                  <th className="p-4 md:p-6 text-right text-xs font-black uppercase tracking-widest text-slate-400">
                    Audit
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const stateConfig =
                    ORDER_STATUS_MAP[order.status] ||
                    ORDER_STATUS_MAP["PENDING_PAYMENT"];

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedOrder(order);
                        setOverrideStatus(order.status);
                      }}
                    >
                      <td className="p-4 md:p-6">
                        <p className="font-bold font-mono text-navy-dark dark:text-white">
                          #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs font-bold text-slate-400 mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="p-4 md:p-6">
                        <p className="font-bold text-sm text-navy-dark dark:text-white uppercase tracking-wider">
                          {order.merchant?.businessName || "N/A"}{" "}
                          <span className="text-slate-400 font-normal lowercase">
                            (Seller)
                          </span>
                        </p>
                        <p className="font-bold text-sm text-brand mt-1 line-clamp-1">
                          {order.buyer.firstName || order.buyer.lastName
                            ? `${order.buyer.firstName} ${order.buyer.lastName}`
                            : order.buyer.email.split("@")[0]}{" "}
                          <span className="text-slate-400 font-normal lowercase">
                            (Buyer)
                          </span>
                        </p>
                      </td>
                      <td className="p-4 md:p-6">
                        <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                          {order.quote.rfq.quantity}{" "}
                          {order.quote.rfq.product.unit}(s)
                        </p>
                        <p className="text-xs font-bold text-slate-500 uppercase mt-1">
                          {order.quote.rfq.product.name}
                        </p>
                      </td>
                      <td className="p-4 md:p-6">
                        <p className="font-black text-sm text-navy-dark dark:text-white">
                          ₦{(order.totalAmountKobo / 100).toLocaleString()}
                        </p>
                      </td>
                      <td className="p-4 md:p-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${stateConfig.color}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {stateConfig.icon}
                          </span>
                          {stateConfig.label}
                        </span>
                      </td>
                      <td className="p-4 md:p-6 text-right whitespace-nowrap">
                        {user?.role !== "SUPPORT" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 font-bold tracking-wider uppercase text-xs"
                          >
                            Override
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4">
              task_alt
            </span>
            <p className="text-lg font-bold text-navy-dark dark:text-white">
              No Orders Found
            </p>
            <p className="text-sm font-medium text-slate-500 mt-2">
              The platform has not processed any orders yet.
            </p>
          </div>
        )}
      </section>

      {/* Audit Override Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8">
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600">
                    <span className="material-symbols-outlined font-bold">
                      warning
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-widest">
                      Force Resolver
                    </h2>
                    <p className="text-xs font-bold text-slate-500 font-mono mt-0.5">
                      #{selectedOrder.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl text-sm font-medium text-red-800 dark:text-red-400">
                <span className="font-bold">DANGER:</span> Forcibly changing an
                order state bypasses the Paystack OTP logic and merchant safety
                constraints. Use ONLY for dispute resolution (e.g manual
                refunds).
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Target State Transition
                </label>
                <select
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold text-navy-dark dark:text-white focus:border-brand focus:ring-0 outline-none"
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                >
                  {Object.keys(ORDER_STATUS_MAP).map((statusKey) => (
                    <option key={statusKey} value={statusKey}>
                      {ORDER_STATUS_MAP[statusKey].label} ({statusKey})
                    </option>
                  ))}
                </select>
              </div>

              <Button
                className="w-full h-12 text-sm font-black tracking-widest uppercase bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20"
                onClick={handleForceResolve}
                disabled={
                  forceResolveMutation.isPending ||
                  overrideStatus === selectedOrder.status
                }
              >
                {forceResolveMutation.isPending
                  ? "Applying Override..."
                  : "Execute Force Transition"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
