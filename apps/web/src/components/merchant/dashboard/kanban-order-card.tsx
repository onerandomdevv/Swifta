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
      <div className="bg-white dark:bg-slate-900 border-2 border-primary p-4 rounded-xl shadow-sm flex flex-col h-[190px] active:scale-[0.98] transition-transform">
        <div className="flex justify-between items-start mb-2.5">
          <span className="text-[10px] font-mono text-primary font-bold">
            #HW-{order.id.slice(0, 4).toUpperCase()}
          </span>
          <span className="text-[9px] px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-black rounded-lg uppercase tracking-wider italic">
            Urgent
          </span>
        </div>
        <h4
          className="text-sm font-black mb-1 text-slate-900 dark:text-white leading-tight"
          title={order.rfq.product.name}
        >
          {order.rfq.quantity} {order.rfq.product.unit}s of{" "}
          {order.rfq.product.name}
        </h4>
        <p
          className="text-[11px] text-slate-500 mb-4 font-medium flex items-center gap-1"
          title={order.buyerId}
        >
          <span className="material-symbols-outlined text-[14px]">person</span>
          Buyer: {order.buyerId.split("-")[0].toUpperCase()}
        </p>
        <div className="space-y-2 mt-auto">
          <button
            className="w-full bg-primary text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
            onClick={() => onAction(order.id)}
          >
            Generate OTP
          </button>
          <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-wider">
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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm h-[180px] flex flex-col hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer group active:scale-[0.98]"
        role="button"
        tabIndex={0}
        onClick={() => onAction(order.id)}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && onAction(order.id)
        }
      >
        <div className="flex justify-between items-start mb-2.5">
          <span className="text-[10px] font-mono text-slate-400 font-bold">
            #HW-{order.id.slice(0, 4).toUpperCase()}
          </span>
          <div className="flex items-center gap-1 text-[9px] text-blue-500 font-black uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">
              local_shipping
            </span>
            ON ROAD
          </div>
        </div>
        <h4
          className="text-sm font-black mb-1 text-slate-900 dark:text-white leading-tight"
          title={order.rfq.product.name}
        >
          {order.rfq.quantity} {order.rfq.product.unit}s of{" "}
          {order.rfq.product.name}
        </h4>
        <p
          className="text-[11px] text-slate-500 mb-3 font-medium flex items-center gap-1"
          title={order.buyerId}
        >
          <span className="material-symbols-outlined text-[14px]">person</span>
          Buyer: {order.buyerId.split("-")[0].toUpperCase()}
        </p>
        <div className="mt-auto">
          <div className="w-full bg-slate-50 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2.5">
            <div className="bg-primary h-full w-[65%] rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
          </div>
          <div className="flex justify-between text-[9px] uppercase font-black tracking-widest text-slate-400">
            <span>In Transit</span>
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
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:border-emerald-500/50 transition-all cursor-pointer active:scale-[0.98]"
      role="button"
      tabIndex={0}
      onClick={() => onAction(order.id)}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && onAction(order.id)
      }
    >
      <div className="flex justify-between items-start mb-2.5">
        <span className="text-[10px] font-mono text-slate-400 font-bold">
          #HW-{order.id.slice(0, 4).toUpperCase()}
        </span>
        <span className="text-[9px] text-emerald-500 font-black flex items-center gap-1 uppercase tracking-widest">
          <span className="material-symbols-outlined text-[14px]">
            verified
          </span>
          DONE
        </span>
      </div>
      <h4
        className="text-sm font-black mb-1 text-slate-900 dark:text-white leading-tight"
        title={order.quote?.rfq?.product?.name}
      >
        {order.quote?.rfq?.quantity} {order.quote?.rfq?.product?.unit}s of{" "}
        {order.quote?.rfq?.product?.name}
      </h4>
      <p
        className="text-[11px] text-slate-500 font-medium flex items-center gap-1"
        title={order.buyerId}
      >
        <span className="material-symbols-outlined text-[14px]">person</span>
        Buyer: {order.buyerId.split("-")[0].toUpperCase()}
      </p>
    </div>
  );
}
