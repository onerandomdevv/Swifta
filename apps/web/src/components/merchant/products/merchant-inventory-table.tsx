import React from "react";
import type { Product } from "@twizrr/shared";
import { InventoryRow } from "./inventory-row";

interface Props {
  products: Product[];
  onRepost: (product: Product) => void;
}

export function MerchantInventoryTable({ products, onRepost }: Props) {
  return (
    <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse relative min-w-[800px]">
          <thead className="bg-background-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-foreground-muted uppercase tracking-widest">
                Product Description
              </th>
              <th className="px-6 py-4 text-xs font-black text-foreground-muted uppercase tracking-widest">
                Stock Level
              </th>
              <th className="px-6 py-4 text-xs font-black text-foreground-muted uppercase tracking-widest">
                Warehouse Location
              </th>
              <th className="px-6 py-4 text-xs font-black text-foreground-muted uppercase tracking-widest">
                Unit of Measure
              </th>
              <th className="px-6 py-4 text-xs font-black text-foreground-muted uppercase tracking-widest">
                Market Status
              </th>
              <th className="px-6 py-4 text-xs font-black text-foreground-muted uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {products.map((product) => (
              <InventoryRow
                key={product.id}
                product={product}
                onRepost={onRepost}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
