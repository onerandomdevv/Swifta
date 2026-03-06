"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrder, dispatchOrder } from "@/lib/api/order.api";
import type { Order } from "@hardware-os/shared";
import { OrderStatus } from "@hardware-os/shared";

interface OrderDrawerProps {
  orderId: string | null;
  onClose: () => void;
  onDispatchSuccess: (order: Order) => void;
}

import { formatKobo } from "@/lib/utils";

const STATUS_FLOW: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAID,
  OrderStatus.DISPATCHED,
  OrderStatus.DELIVERED,
];

function getStepState(
  currentStatus: OrderStatus,
  stepStatus: OrderStatus,
): "completed" | "current" | "pending" {
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);
  const stepIdx = STATUS_FLOW.indexOf(stepStatus);
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "current";
  return "pending";
}

export function OrderDrawer({
  orderId,
  onClose,
  onDispatchSuccess,
}: OrderDrawerProps) {
  const queryClient = useQueryClient();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    getOrder(orderId)
      .then((data) => setOrder(data as any as Order))
      .catch((err: any) => setError(err?.message || "Failed to load order"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const dispatchMutation = useMutation({
    mutationFn: () => dispatchOrder(order!.id),
    onSuccess: (updated) => {
      const updatedOrder = updated as any as Order;
      setOrder(updatedOrder);
      queryClient.invalidateQueries({ queryKey: ["merchant", "orders"] });
      onDispatchSuccess(updatedOrder);
    },
    onError: (err: any) => {
      setError(err?.message || "Failed to dispatch order");
    },
  });

  if (!orderId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 h-full w-[35%] min-w-[450px] bg-white dark:bg-slate-900 z-50 flex flex-col border-l border-slate-400 dark:border-slate-700 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white uppercase">
              Order #{order?.id?.slice(0, 8) || "..."}
            </h2>
            {order && (
              <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1 border border-slate-900 dark:border-white">
                <p className="text-[10px] font-bold tracking-widest uppercase">
                  {order.status}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <span className="material-symbols-outlined text-slate-500 text-2xl">
              close
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error && !order ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <span className="material-symbols-outlined text-4xl text-red-400 mb-4">
                error
              </span>
              <p className="text-sm font-bold text-red-500">{error}</p>
            </div>
          ) : order ? (
            <>
              {/* Section 1: Order Timeline */}
              <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary"></span> 1. Order Timeline
                </h3>
                <div className="space-y-0">
                  {STATUS_FLOW.map((step, idx) => {
                    const state = getStepState(
                      order.status as OrderStatus,
                      step,
                    );
                    const isLast = idx === STATUS_FLOW.length - 1;
                    return (
                      <div
                        key={step}
                        className="relative flex gap-6 pb-10 last:pb-0"
                      >
                        {/* Connector Line */}
                        {!isLast && (
                          <div
                            className={`absolute left-[15px] top-[32px] bottom-[-8px] w-[2px] ${
                              state === "completed"
                                ? "bg-slate-900 dark:bg-white"
                                : "bg-slate-200 dark:bg-slate-700"
                            }`}
                          />
                        )}
                        {/* Step Icon */}
                        <div
                          className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center ${
                            state === "completed"
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-900 dark:border-white"
                              : state === "current"
                                ? "border-2 border-primary bg-white dark:bg-slate-900"
                                : "border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          }`}
                        >
                          {state === "completed" ? (
                            <span className="material-symbols-outlined text-lg">
                              check
                            </span>
                          ) : state === "current" ? (
                            <div className="h-3 w-3 bg-primary"></div>
                          ) : (
                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-sm">
                              circle
                            </span>
                          )}
                        </div>
                        {/* Step Label */}
                        <div className="pt-1">
                          <p
                            className={`text-sm font-bold uppercase tracking-tight ${
                              state === "completed"
                                ? "text-slate-900 dark:text-white"
                                : state === "current"
                                  ? "text-primary"
                                  : "text-slate-400"
                            }`}
                          >
                            {step}
                          </p>
                          <p
                            className={`text-xs uppercase font-medium mt-1 ${
                              state === "current"
                                ? "text-slate-500"
                                : "text-slate-400"
                            }`}
                          >
                            {state === "completed"
                              ? "Completed"
                              : state === "current"
                                ? "Current Stage"
                                : "Pending"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Product & Pricing */}
              <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary"></span> 2. Product &
                  Pricing
                </h3>
                <table className="w-full border-collapse border border-slate-200 dark:border-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="text-left px-4 py-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Item Details
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Order Items
                        </p>
                        <p className="text-xs font-mono text-slate-500 mt-1">
                          Subtotal
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right align-top">
                        <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                          {formatKobo(order.totalAmountKobo)}
                        </p>
                      </td>
                    </tr>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/30">
                      <td className="px-4 py-3 text-xs font-medium text-slate-500">
                        Delivery Fee
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-mono text-slate-900 dark:text-white font-bold">
                        {formatKobo(order.deliveryFeeKobo)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 dark:bg-white">
                      <td className="px-4 py-4 text-xs font-bold text-white dark:text-slate-900 uppercase tracking-widest">
                        Total Order Value
                      </td>
                      <td className="px-4 py-4 text-right text-lg font-mono font-bold text-primary">
                        {formatKobo(
                          Number(order.totalAmountKobo) +
                            Number(order.deliveryFeeKobo),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Section 3: Delivery Logistics */}
              <div className="p-8 bg-white dark:bg-slate-900">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary"></span> 3. Delivery
                  Logistics
                </h3>
                <div className="grid grid-cols-2 border border-slate-200 dark:border-slate-700 divide-x divide-slate-200 dark:divide-slate-700 mb-4">
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Order ID
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Created
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {new Date(order.createdAt).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* OTP Display (if dispatched) */}
                {order.deliveryOtp && (
                  <div className="border-2 border-slate-900 dark:border-white p-5 bg-white dark:bg-slate-900 mb-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">
                        lock
                      </span>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                          Delivery OTP
                        </p>
                        <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-widest">
                          {order.deliveryOtp}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payout Status (if applicable) */}
                {(order as any).payoutStatus &&
                  ["PROCESSING", "COMPLETED", "FAILED", "PENDING"].includes(
                    (order as any).payoutStatus,
                  ) && (
                    <div
                      className={`border-2 p-5 mb-4 ${
                        (order as any).payoutStatus === "COMPLETED"
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                          : (order as any).payoutStatus === "FAILED"
                            ? "border-red-500 bg-red-50"
                            : "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${
                            (order as any).payoutStatus === "COMPLETED"
                              ? "text-emerald-600"
                              : (order as any).payoutStatus === "FAILED"
                                ? "text-red-600"
                                : "text-amber-600"
                          }`}
                        >
                          account_balance
                        </span>
                        <div>
                          <p
                            className={`text-[10px] uppercase font-bold mb-1 ${
                              (order as any).payoutStatus === "COMPLETED"
                                ? "text-emerald-700"
                                : (order as any).payoutStatus === "FAILED"
                                  ? "text-red-700"
                                  : "text-amber-700"
                            }`}
                          >
                            Payout Status
                          </p>
                          <p
                            className={`text-sm font-black tracking-widest uppercase ${
                              (order as any).payoutStatus === "COMPLETED"
                                ? "text-emerald-800 dark:text-emerald-400"
                                : (order as any).payoutStatus === "FAILED"
                                  ? "text-red-800 dark:text-red-400"
                                  : "text-amber-800 dark:text-amber-400"
                            }`}
                          >
                            {(order as any).payoutStatus.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer — Dispatch Button (only for PAID orders) */}
        {order && order.status === OrderStatus.PAID && (
          <div className="p-6 bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-800">
            <button
              onClick={() => dispatchMutation.mutate()}
              disabled={dispatchMutation.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 px-8 text-sm uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-4 shadow-lg disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-xl">
                local_shipping
              </span>
              <span>
                {dispatchMutation.isPending
                  ? "Dispatching..."
                  : "Dispatch Order"}
              </span>
            </button>
          </div>
        )}

        {/* Error display */}
        {error && order && (
          <div className="px-6 pb-4 bg-white dark:bg-slate-900">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
              {error}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
