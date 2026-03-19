import React from "react";
import Link from "next/link";
import type { Order } from "@swifta/shared";
import { Money } from "@/components/ui/money";

interface Props {
  activeOrdersCount: number;
  totalSpendingKobo?: string;
  orders: Order[];
}

export function BuyerSummaryCards({
  activeOrdersCount,
  totalSpendingKobo,
  orders,
}: Props) {
  // Escrow is considered locked when it is PAID or DISPATCHED
  const escrowLocked = totalSpendingKobo
    ? BigInt(totalSpendingKobo)
    : orders
        .filter((o) => o.status === "PAID" || o.status === "DISPATCHED")
        .reduce((sum, o) => sum + BigInt(o.totalAmountKobo || 0), 0n);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      <Link
        href="/buyer/orders"
        className="bg-white dark:bg-slate-900 md:col-span-2 p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl material-symbols-outlined text-sm">
              shopping_bag
            </span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Orders in Pipeline
            </span>
          </div>
          <h3 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight">
            {activeOrdersCount.toString().padStart(2, "0")}
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1 group-hover:text-primary transition-colors">
            View all orders
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </p>
        </div>
        <div className="absolute top-0 right-0 p-8 text-primary/10 group-hover:text-primary/15 transition-colors">
          <span className="material-symbols-outlined text-9xl -mr-8 -mt-8 rotate-12 transition-transform group-hover:rotate-0 duration-700">
            orders
          </span>
        </div>
      </Link>

      <div className="bg-navy-dark dark:bg-black p-6 sm:p-8 rounded-[2rem] border border-navy-dark dark:border-slate-800 shadow-sm relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 bg-white/10 text-white/80 rounded-xl material-symbols-outlined text-sm">
              lock
            </span>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
              Escrow Value
            </span>
          </div>
          <Money
            amount={escrowLocked}
            className="text-3xl font-black text-white tracking-tight"
          />
          <p className="text-[10px] font-bold text-white/20 mt-2 uppercase tracking-widest">
            Protected across Nigeria
          </p>
        </div>
        <div className="absolute right-0 bottom-0 p-4 text-white/10 group-hover:text-white/20 transition-all">
          <span className="material-symbols-outlined text-8xl translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-700">
            verified_user
          </span>
        </div>
      </div>
    </div>
  );
}
