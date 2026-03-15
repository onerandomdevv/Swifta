import React from "react";
import type { Order } from "@swifta/shared";

interface Props {
  order: Order;
}

export function OrderReferenceSidebar({ order }: Props) {
  return (
    <div className="bg-background-secondary/50 backdrop-blur-xl border border-border rounded-[3rem] p-10 space-y-10">
      <div className="space-y-3">
        <p className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.3em]">
          Registry UUID
        </p>
        <div className="p-4 bg-surface rounded-2xl border border-border shadow-sm">
          <p className="text-[11px] font-mono font-bold text-foreground break-all leading-relaxed">
            {order.id}
          </p>
        </div>
      </div>
      
      {/* Source Quote hidden for B2C flow */}

      <div className="grid grid-cols-2 gap-6 pt-6 border-t border-border">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.2em]">
            Currency
          </p>
          <p className="text-sm font-black text-foreground uppercase tracking-tighter">
            {order.currency}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.2em]">
            Order ID
          </p>
          <p className="text-sm font-black text-primary uppercase tracking-tighter">
            Swifta/V5
          </p>
        </div>
      </div>
    </div>
  );
}
