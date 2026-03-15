import React from "react";
import Link from "next/link";
import type { Order } from "@hardware-os/shared";

interface Props {
  order: Order;
}

export function DeliveryCard({ order }: Props) {
  const shortId = `#SW-${order.id.slice(0, 8).toUpperCase()}`;

  const location =
    (order as any).metadata?.deliveryAddress || "Lagos Delivery Hub";

  let statusConfig: { bg: string; text: string; border: string; label: string; icon: string } = {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    label: order.status,
    icon: "help",
  };

  switch (order.status) {
    case "PENDING_PAYMENT":
      statusConfig = {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        label: "Payment Required",
        icon: "payments",
      };
      break;
    case "PAID":
      statusConfig = {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        label: "Awaiting Dispatch",
        icon: "hourglass_top",
      };
      break;
    case "DISPATCHED":
      statusConfig = {
        bg: "bg-indigo-50",
        text: "text-indigo-700",
        border: "border-indigo-200",
        label: "In Transit",
        icon: "local_shipping",
      };
      break;
    case "COMPLETED":
      statusConfig = {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        label: "Delivered",
        icon: "check_circle",
      };
      break;
  }

  const productName =
    (order as any).product?.name || (order as any).items?.[0]?.product?.name || "Order Shipment";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 dark:text-slate-500 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">
              {shortId}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
            >
              <span className="material-symbols-outlined text-xs">
                {statusConfig.icon}
              </span>
              {statusConfig.label}
            </span>
          </div>
          <div className="min-w-0">
            <h4 className="text-slate-900 dark:text-white text-lg font-black leading-tight mb-1 truncate">
              {productName}
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">
                location_on
              </span>
              {location}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {order.status === "DISPATCHED" && (
            <Link
              href={`/buyer/orders/${order.id}`}
              className="w-full sm:w-auto border border-primary text-primary hover:bg-primary hover:text-white dark:text-emerald-400 dark:border-emerald-500/30 text-center font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-sm"
            >
              Track Order
            </Link>
          )}

          {order.status === "PENDING_PAYMENT" && (
            <Link
              href={`/buyer/orders/${order.id}`}
              className="w-full sm:w-auto bg-primary text-white text-center font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Make Payment
            </Link>
          )}

          {order.status === "DISPATCHED" ? (
            <Link
              href={`/buyer/orders/${order.id}`}
              className="w-full sm:w-auto bg-primary text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-widest hover:bg-primary/90 transition-all text-center shadow-lg shadow-primary/20"
            >
              Confirm Delivery Code
            </Link>
          ) : (
            <span
              aria-disabled="true"
              role="button"
              className="w-full sm:w-auto font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-widest text-center bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed select-none border border-slate-100 dark:border-slate-700"
            >
              Confirm Delivery Code
            </span>
          )}
        </div>
      </div>
      
      {/* Decorative accent for group hover */}
      <div className="absolute top-0 right-0 w-2 h-full bg-primary/0 group-hover:bg-primary/10 transition-colors" />
    </div>
  );
}
