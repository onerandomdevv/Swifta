import React from "react";
import type { Order } from "@hardware-os/shared";
import { DeliveryCard } from "./delivery-card";

interface Props {
  deliveries: Order[];
}

export function ActiveDeliveries({ deliveries }: Props) {
  if (!deliveries || deliveries.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900">
        Active Deliveries (Status)
      </h2>
      <div className="space-y-4">
        {deliveries.map((order) => (
          <DeliveryCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}
