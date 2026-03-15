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
        className="fixed inset-0 bg-background/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 h-full w-[35%] min-w-[450px] bg-surface z-50 flex flex-col border-l border-border shadow-[-10px_0_30px_rgba(0,0,0,0.1)] animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tighter text-foreground uppercase">
              Order #{order?.id?.slice(0, 8) || "..."}
            </h2>
            {order && (
              <div className="bg-foreground text-background px-3 py-1 border border-foreground">
                <p className="text-[10px] font-bold tracking-widest uppercase">
                  {order.status}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-background-secondary transition-colors flex items-center justify-center border border-transparent hover:border-border"
          >
            <span className="material-symbols-outlined text-foreground-muted text-2xl">
              close
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-background-secondary">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error && !order ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <span className="material-symbols-outlined text-4xl text-red-500 mb-4">
                error
              </span>
              <p className="text-sm font-bold text-red-500">{error}</p>
            </div>
          ) : order ? (
            <>
              {/* Section 1: Order Timeline */}
              <div className="p-8 border-b border-border bg-surface">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground-muted mb-8 flex items-center gap-2">
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
                                ? "bg-foreground"
                                : "bg-border"
                            }`}
                          />
                        )}
                        {/* Step Icon */}
                        <div
                          className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center ${
                            state === "completed"
                              ? "bg-foreground text-background border border-foreground"
                              : state === "current"
                                ? "border-2 border-primary bg-surface"
                                : "border border-border bg-background-secondary"
                          }`}
                        >
                          {state === "completed" ? (
                            <span className="material-symbols-outlined text-lg">
                              check
                            </span>
                          ) : state === "current" ? (
                            <div className="h-3 w-3 bg-primary"></div>
                          ) : (
                            <span className="material-symbols-outlined text-foreground-muted/40 text-sm">
                              circle
                            </span>
                          )}
                        </div>
                        {/* Step Label */}
                        <div className="pt-1">
                          <p
                            className={`text-sm font-bold uppercase tracking-tight ${
                              state === "completed"
                                ? "text-foreground"
                                : state === "current"
                                  ? "text-primary"
                                  : "text-foreground-muted"
                            }`}
                          >
                            {step}
                          </p>
                          <p
                            className={`text-xs uppercase font-medium mt-1 ${
                              state === "current"
                                ? "text-foreground-secondary"
                                : "text-foreground-muted"
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
              <div className="p-8 border-b border-border bg-surface">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground-muted mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary"></span> 2. Product &
                  Pricing
                </h3>
                <table className="w-full border-collapse border border-border">
                  <thead className="bg-background-secondary border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-[10px] uppercase font-bold text-foreground-muted tracking-wider">
                        Item Details
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] uppercase font-bold text-foreground-muted tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-foreground">
                          Order Items
                        </p>
                        <p className="text-xs font-mono text-foreground-muted mt-1">
                          Subtotal
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right align-top">
                        <p className="text-sm font-mono font-bold text-foreground">
                          {formatKobo(order.totalAmountKobo)}
                        </p>
                      </td>
                    </tr>
                    <tr className="bg-background-secondary/30">
                      <td className="px-4 py-3 text-xs font-medium text-foreground-secondary">
                        Delivery Fee
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-mono text-foreground font-bold">
                        {formatKobo(order.deliveryFeeKobo)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-foreground text-background">
                      <td className="px-4 py-4 text-xs font-bold uppercase tracking-widest">
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
              <div className="p-8 bg-surface">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground-muted mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary"></span> 3. Delivery
                  Logistics
                </h3>
                <div className="grid grid-cols-2 border border-border divide-x divide-border mb-4">
                  <div className="p-4 bg-background-secondary/30">
                    <p className="text-[10px] uppercase font-bold text-foreground-muted mb-1">
                      Order ID
                    </p>
                    <p className="text-sm font-bold text-foreground font-mono">
                      {order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="p-4 bg-background-secondary/30">
                    <p className="text-[10px] uppercase font-bold text-foreground-muted mb-1">
                      Created
                    </p>
                    <p className="text-sm font-bold text-foreground">
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
                  <div className="border-2 border-foreground p-5 bg-surface mb-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">
                        lock
                      </span>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-foreground-muted mb-1">
                          Delivery OTP
                        </p>
                        <p className="text-2xl font-mono font-bold text-foreground tracking-widest">
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
                          ? "border-emerald-500 bg-emerald-500/10"
                          : (order as any).payoutStatus === "FAILED"
                            ? "border-red-500 bg-red-500/10"
                            : "border-amber-400 bg-amber-400/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${
                            (order as any).payoutStatus === "COMPLETED"
                              ? "text-emerald-500"
                              : (order as any).payoutStatus === "FAILED"
                                ? "text-red-500"
                                : "text-amber-500"
                          }`}
                        >
                          account_balance
                        </span>
                        <div>
                          <p
                            className={`text-[10px] uppercase font-bold mb-1 ${
                              (order as any).payoutStatus === "COMPLETED"
                                ? "text-emerald-600"
                                : (order as any).payoutStatus === "FAILED"
                                  ? "text-red-600"
                                  : "text-amber-600"
                            }`}
                          >
                            Payout Status
                          </p>
                          <p
                            className={`text-sm font-black tracking-widest uppercase ${
                              (order as any).payoutStatus === "COMPLETED"
                                ? "text-emerald-700 dark:text-emerald-400"
                                : (order as any).payoutStatus === "FAILED"
                                  ? "text-red-700 dark:text-red-400"
                                  : "text-amber-700 dark:text-amber-400"
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
          <div className="p-6 bg-surface border-t-2 border-border">
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
          <div className="px-6 pb-4 bg-surface">
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-500 uppercase tracking-wide">
              {error}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
