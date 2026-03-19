import React from "react";
import type { Order } from "@swifta/shared";
import { DeliveryCard } from "./delivery-card";

interface Props {
  deliveries: Order[];
}

export function ActiveDeliveries({ deliveries }: Props) {
  if (!deliveries || deliveries.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span className="p-2 bg-primary/10 text-primary rounded-xl material-symbols-outlined text-sm">
            local_shipping
          </span>
          Active Deliveries
        </h2>
        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
          {deliveries.length} Packages
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {deliveries.map((order) => (
          <DeliveryCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}
