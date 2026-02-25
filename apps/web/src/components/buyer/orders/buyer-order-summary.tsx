import React from "react";
import { formatKobo } from "@hardware-os/shared";
import type { Order } from "@hardware-os/shared";

interface Props {
  order: Order;
}

export function BuyerOrderSummary({ order }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] w-full">
      <div className="bg-slate-900 dark:bg-slate-100 p-3 flex items-center justify-between">
        <h3 className="text-xs font-bold text-white dark:text-slate-900 uppercase tracking-widest pl-1">
          Order Summary
        </h3>
        <span className="material-symbols-outlined text-white dark:text-slate-900 text-sm">receipt_long</span>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Amount
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatKobo(BigInt(order.totalAmountKobo))}
          </span>
        </div>

        <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Delivery Fee
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
            {formatKobo(BigInt(order.deliveryFeeKobo))}
          </span>
        </div>

        <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Currency
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {order.currency}
          </span>
        </div>

        <div className="flex justify-between items-end">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Created
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {new Date(order.createdAt).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
