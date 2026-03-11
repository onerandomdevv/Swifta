import React from "react";
import Link from "next/link";
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
      {order.quoteId ? (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Quote Reference
          </p>
          <p className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-widest break-all">
            {order.quoteId}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Order Type
          </p>
          <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded border border-emerald-100 dark:border-emerald-800/30 text-[10px] w-fit font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">flash_on</span>
            Direct Purchase
          </div>
        </div>
      )}

      {order.merchant && (
        <div className="space-y-2 pt-6 border-t border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Supplier
          </p>
          <Link
            href={`/buyer/merchants/${order.merchantId || order.merchant.id}`}
            className="flex items-center gap-2 text-xs font-black text-accent-orange uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
          >
            <span className="material-symbols-outlined text-sm">
              storefront
            </span>
            {order.merchant.businessName}
          </Link>
        </div>
      )}
    </div>
  );
}
