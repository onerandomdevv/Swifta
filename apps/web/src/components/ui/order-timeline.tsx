"use client";

import React from "react";

const STEPS = [
  {
    key: "PENDING_PAYMENT",
    label: "Payment",
    icon: "payments",
    description: "Awaiting buyer payment",
  },
  {
    key: "PAID",
    label: "Paid",
    icon: "verified",
    description: "Payment confirmed — in escrow",
  },
  {
    key: "PREPARING",
    label: "Preparing",
    icon: "inventory",
    description: "Merchant is packing your order",
  },
  {
    key: "DISPATCHED",
    label: "Dispatched",
    icon: "local_shipping",
    description: "Merchant has shipped the order",
  },
  {
    key: "IN_TRANSIT",
    label: "In Transit",
    icon: "directions_car",
    description: "Order is on the way",
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    icon: "inventory_2",
    description: "Buyer confirmed delivery via OTP",
  },
  {
    key: "COMPLETED",
    label: "Completed",
    icon: "check_circle",
    description: "Payout disbursed to merchant",
  },
];

function getStepIndex(status: string): number {
  if (status === "CANCELLED" || status === "DISPUTE") return -1;
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

interface OrderTimelineProps {
  status: string;
  createdAt?: string | Date;
  trackingEvents?: any[];
  className?: string;
}

export function OrderTimeline({
  status,
  createdAt,
  trackingEvents = [],
  className = "",
}: OrderTimelineProps) {
  const activeIndex = getStepIndex(status);
  const isCancelled = status === "CANCELLED";
  const isDispute = status === "DISPUTE";

  if (isCancelled) {
    return (
      <div
        className={`p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg ${className}`}
      >
        <div className="flex items-center gap-4">
          <div className="size-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">
              cancel
            </span>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-red-600 dark:text-red-400">
              Order Cancelled
            </p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              This order has been cancelled. Any reserved stock has been
              released.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isDispute) {
    return (
      <div
        className={`p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg ${className}`}
      >
        <div className="flex items-center gap-4">
          <div className="size-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">
              gavel
            </span>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Dispute Under Review
            </p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              The admin team is reviewing this dispute. Funds remain in escrow
              until resolved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg ${className}`}
    >
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
        Order Progress
      </h4>
      <div className="relative">
        {STEPS.map((step, idx) => {
          const isActive = idx === activeIndex;
          const isCompleted = idx < activeIndex;
          const isPending = idx > activeIndex;
          const stepEvents = trackingEvents.filter((e) => e.status === step.key);

          return (
            <div key={step.key} className="flex items-start gap-4 relative">
              {/* Vertical connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`absolute left-[19px] top-[38px] w-0.5 h-[calc(100%-2px)] ${
                    isCompleted
                      ? "bg-emerald-400"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              )}

              {/* Step icon */}
              <div
                className={`size-10 rounded-full flex items-center justify-center shrink-0 relative z-10 transition-all duration-300 ${
                  isCompleted
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    : isActive
                      ? "bg-primary/10 text-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600"
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {isCompleted ? "check" : step.icon}
                </span>
              </div>

              {/* Step content */}
              <div className={`pb-8 ${idx === STEPS.length - 1 ? "pb-0" : ""}`}>
                <p
                  className={`text-sm font-bold uppercase tracking-wider ${
                    isCompleted
                      ? "text-emerald-600 dark:text-emerald-400"
                      : isActive
                        ? "text-primary font-black"
                        : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    isPending
                      ? "text-slate-300 dark:text-slate-600"
                      : "text-slate-500"
                  }`}
                >
                  {step.description}
                </p>

                {/* Tracking notes */}
                {stepEvents.map((evt, eIdx) => (
                  <div
                    key={evt.id || eIdx}
                    className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800"
                  >
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {evt.note ? (
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-primary">
                            chat
                          </span>
                          Merchant says: {evt.note}
                        </span>
                      ) : (
                        "Status updated"
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-bold tracking-wider uppercase">
                      {new Date(evt.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
