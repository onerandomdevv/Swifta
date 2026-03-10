import React from "react";
import Link from "next/link";
import type { Order } from "@hardware-os/shared";
import { Money } from "@/components/ui/money";

interface Props {
  activeOrdersCount: number;
  pendingQuotesCount: number;
  totalSpendingKobo?: string;
  orders: Order[];
}

export function BuyerSummaryCards({
  activeOrdersCount,
  pendingQuotesCount,
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Link
        href="/buyer/orders"
        className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
      >
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Active Orders
          </p>
          <span className="material-symbols-outlined text-slate-200 group-hover:text-primary transition-colors">
            arrow_forward_ios
          </span>
        </div>
        <p className="text-4xl font-black text-navy-dark dark:text-white mt-4">
          {activeOrdersCount.toString().padStart(2, "0")}
        </p>
      </Link>

      <Link
        href="/buyer/rfqs"
        className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
      >
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Pending Quotes
          </p>
          <span className="material-symbols-outlined text-slate-200 group-hover:text-primary transition-colors">
            arrow_forward_ios
          </span>
        </div>
        <p className="text-4xl font-black text-navy-dark dark:text-white mt-4">
          {pendingQuotesCount.toString().padStart(2, "0")}
        </p>
      </Link>

      <div className="bg-navy-dark p-6 border border-navy-dark rounded-3xl shadow-sm relative overflow-hidden group">
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] relative z-10">
          Total Escrow Locked
        </p>
        <Money
          amount={escrowLocked}
          className="text-3xl font-black text-white mt-4 block relative z-10"
        />
        <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-7xl text-white/5 group-hover:scale-110 transition-transform duration-700">
          lock
        </span>
      </div>
    </div>
  );
}
