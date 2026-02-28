import React from "react";
import { formatKobo } from "@hardware-os/shared";
import type { Order } from "@hardware-os/shared";

interface Props {
  order: Order;
}

export function FulfillmentDetails({ order }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
      <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
          Fulfillment Details
        </h3>
      </div>

      <div className="p-10 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Total Order Value
            </p>
            <p className="text-4xl font-black text-navy-dark dark:text-white tabular-nums tracking-tighter">
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
      </div>

      <div className="p-10 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start gap-10">
        <div className="flex-1 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Settlement Info
          </p>
          <div className="flex items-center gap-3">
            <div
              className={`size-2 rounded-full ${order.status === "PENDING_PAYMENT" ? "bg-amber-500" : "bg-emerald-500"}`}
            ></div>
            <p className="text-sm font-black text-navy-dark dark:text-white uppercase">
              {order.status.replace("_", " ")}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed max-w-xs">
            Funds are held in escrow and will be released upon buyer OTP
            verification.
          </p>
        </div>
      </div>
    </div>
  );
}
