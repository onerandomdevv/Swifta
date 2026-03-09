import React from "react";
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-6 border border-slate-200 rounded shadow-sm">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Active Orders
        </p>
        <p className="text-3xl font-bold font-mono text-slate-900 mt-2">
          {activeOrdersCount.toString().padStart(2, "0")}
        </p>
      </div>
      <div className="bg-white p-6 border border-slate-200 rounded shadow-sm">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Pending Quotes
        </p>
        <p className="text-3xl font-bold font-mono text-slate-900 mt-2">
          {pendingQuotesCount.toString().padStart(2, "0")}
        </p>
      </div>
      <div className="bg-white p-6 border border-primary/20 bg-primary/5 rounded shadow-sm">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider">
          Total Escrow Locked
        </p>
        <Money
          amount={escrowLocked}
          className="text-2xl font-bold font-mono text-slate-900 mt-2 block"
        />
      </div>
    </div>
  );
}
