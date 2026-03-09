import React from "react";
import type { Order } from "@hardware-os/shared";

interface Props {
  order: Order;
  onAction: (orderId: string) => void;
}

export function KanbanOrderCard({ order, onAction }: Props) {
  // Styling and content specifically adapted for each order status based on the provided Stitch design rules.

  if (order.status === "PAID") {
    // Awaiting Dispatch Style (Blue theme, Urgent Tag, Generate OTP button)
    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-primary p-4 shadow-sm flex flex-col h-[180px]">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-mono text-primary font-bold">
            #HW-{order.id.slice(0, 4).toUpperCase()}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold rounded uppercase tracking-tighter italic">
            Urgent
          </span>
        </div>
        <h4
          className="text-sm font-bold mb-1 truncate text-slate-900 dark:text-white"
          title={order.rfq.product.name}
        >
          {order.rfq.quantity} {order.rfq.product.unit}s of{" "}
          {order.rfq.product.name}
        </h4>
        <p
          className="text-xs text-slate-500 mb-4 truncate"
          title={order.buyerId}
        >
          Buyer ID: {order.buyerId.split("-")[0].toUpperCase()}
        </p>
        <div className="space-y-2 mt-auto">
          <button
            className="w-full bg-primary text-white py-2 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
            onClick={() => onAction(order.id)}
          >
            Generate Dispatch OTP
          </button>
          <p className="text-[9px] text-center text-slate-400 italic">
            Ready for carrier
          </p>
        </div>
      </div>
    );
  }

  if (order.status === "DISPATCHED") {
    // In Transit Style (Basic border, Progress Bar, Route markers)
    return (
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm h-[180px] flex flex-col hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={() => onAction(order.id)}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && onAction(order.id)
        }
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-mono text-slate-400">
            #HW-{order.id.slice(0, 4).toUpperCase()}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold">
            <span className="material-symbols-outlined text-sm">
              local_shipping
            </span>
            ON ROAD
          </div>
        </div>
        <h4
          className="text-sm font-bold mb-1 truncate text-slate-900 dark:text-white"
          title={order.rfq.product.name}
        >
          {order.rfq.quantity} {order.rfq.product.unit}s of{" "}
          {order.rfq.product.name}
        </h4>
        <p
          className="text-xs text-slate-500 mb-3 truncate"
          title={order.buyerId}
        >
          Buyer ID: {order.buyerId.split("-")[0].toUpperCase()}
        </p>
        <div className="mt-auto">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded overflow-hidden mb-2">
            <div className="bg-primary h-full w-[65%]"></div>
          </div>
          <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400">
            <span>Dispatched</span>
            <span
              className="truncate max-w-[100px] text-right"
              title={order.quote?.rfq?.deliveryAddress}
            >
              {order.quote?.rfq?.deliveryAddress?.split(",")[0]?.trim() ||
                "Unknown"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Payout Completed Style (Emerald text, simple list view)
  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 transition-colors cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => onAction(order.id)}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && onAction(order.id)
      }
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-mono text-slate-400">
          #HW-{order.id.slice(0, 4).toUpperCase()}
        </span>
        <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
          <span className="material-symbols-outlined text-xs">
            check_circle
          </span>
          COMPLETED
        </span>
      </div>
      <h4
        className="text-sm font-bold mb-1 truncate text-slate-900 dark:text-white"
        title={order.quote?.rfq?.product?.name}
      >
        {order.quote?.rfq?.quantity} {order.quote?.rfq?.product?.unit}s of{" "}
        {order.quote?.rfq?.product?.name}
      </h4>
      <p className="text-xs text-slate-500 truncate" title={order.buyerId}>
        Buyer ID: {order.buyerId.split("-")[0].toUpperCase()}
      </p>
    </div>
  );
}
