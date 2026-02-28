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
      <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Quote Reference
        </p>
        <p className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-widest break-all">
          {order.quoteId}
        </p>
      </div>

      {order.merchant && (
        <div className="space-y-2 pt-6 border-t border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Supplier
          </p>
          <Link
            href={`/merchants/${order.merchantId || order.merchant.id}`}
            className="flex items-center gap-2 text-xs font-black text-accent-orange uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
          >
            <span className="material-symbols-outlined text-sm">storefront</span>
            {order.merchant.businessName}
          </Link>
        </div>
      )}
    </div>
  );
}
