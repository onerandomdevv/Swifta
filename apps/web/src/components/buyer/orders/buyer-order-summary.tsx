import React from "react";
import { formatKobo } from "@hardware-os/shared";
import type { Order } from "@hardware-os/shared";

interface Props {
  order: Order;
}

export function BuyerOrderSummary({ order }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
      <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
          Order Summary
        </h3>
      </div>

      <div className="p-10 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Total Amount
            </p>
            <p className="text-3xl font-black text-navy-dark dark:text-white tabular-nums">
              {formatKobo(BigInt(order.totalAmountKobo))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Delivery Fee
            </p>
            <p className="text-lg font-black text-navy-dark dark:text-white tabular-nums">
              {formatKobo(BigInt(order.deliveryFeeKobo))}
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Currency
            </p>
            <p className="text-sm font-black text-navy-dark dark:text-white">
              {order.currency}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Created
            </p>
            <p className="text-sm font-black text-navy-dark dark:text-white">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
