import React from "react";
import type { Order } from "@hardware-os/shared";

interface Props {
  order: Order;
}

export function OrderReferenceSidebar({ order }: Props) {
  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 space-y-10">
      <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Registry UUID
        </p>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-[11px] font-mono font-bold text-navy-dark dark:text-white break-all leading-relaxed">
            {order.id}
          </p>
        </div>
      </div>
      
      {/* Source Quote hidden for B2C flow */}

      <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Currency
          </p>
          <p className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-tighter">
            {order.currency}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Order ID
          </p>
          <p className="text-sm font-black text-primary uppercase tracking-tighter">
            Hardware-OS/V5
          </p>
        </div>
      </div>
    </div>
  );
}
