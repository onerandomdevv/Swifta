import React from "react";
import type { Product } from "@hardware-os/shared";
import { InventoryRow } from "./inventory-row";

interface Props {
  products: Product[];
  onRepost: (product: Product) => void;
}

export function MerchantInventoryTable({ products, onRepost }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse relative min-w-[800px]">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                Product Description
              </th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                Stock Level
              </th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                Warehouse Location
              </th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                Unit of Measure
              </th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                Market Status
              </th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
