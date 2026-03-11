import React from "react";
import { formatKobo } from "@/lib/utils";
import { Money } from "@/components/ui/money";
import type { Order } from "@hardware-os/shared";

interface Props {
  order: Order;
}

export function FulfillmentDetails({ order }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-sm">
      <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="size-8 rounded-xl bg-navy-dark flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">local_shipping</span>
           </div>
           <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
             Fulfillment Intel
           </h3>
        </div>
        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 rounded-full uppercase tracking-widest">
          Secured
        </span>
      </div>

      <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Order Valuation
          </p>
          <p className="text-4xl font-black text-navy-dark dark:text-white tabular-nums tracking-tighter">
            {formatKobo(order.totalAmountKobo)}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Base Amount + Platform Fees</p>
        </div>
        
        <div className="space-y-1 md:text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Logistics Levy
          </p>
          <p className="text-2xl font-black text-navy-dark dark:text-white tabular-nums tracking-tight">
            {formatKobo(order.deliveryFeeKobo)}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Carrier Settlement</p>
        </div>
      </div>

      <div className="p-10 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-8">
        <div className="flex-1 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Settlement Protection
          </p>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-wider">
              Escrow Governance Active
            </p>
          </div>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed max-w-sm">
            Liquidity is strictly preserved in our industrial vault. Dispatch to initiate the verification phase.
          </p>
        </div>
        
        <div className="shrink-0 flex items-center gap-4">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Commitment</p>
              <p className="text-xl font-black text-primary tabular-nums">
                {formatKobo(Number(order.totalAmountKobo) + Number(order.deliveryFeeKobo))}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
