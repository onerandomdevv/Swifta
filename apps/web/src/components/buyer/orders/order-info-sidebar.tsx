import React from "react";
import type { Order } from "@hardware-os/shared";

interface Props {
  order: Order;
}

export function OrderInfoSidebar({ order }: Props) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 space-y-6">
      <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Order Reference
        </p>
        <p className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-widest break-all">
          {order.id}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Quote Reference
        </p>
        <p className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-widest break-all">
          {order.quoteId}
        </p>
      </div>
    </div>
  );
}
