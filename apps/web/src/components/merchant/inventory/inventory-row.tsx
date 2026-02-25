import React from "react";
import type { Product } from "@hardware-os/shared";

type InventoryRowProps = {
  product: Product;
  onQuickEdit?: (id: string) => void;
};

export function InventoryRow({ product, onQuickEdit }: InventoryRowProps) {
  // Compute stock health percentage for visual bar
  const stockLevel = product.stockCache?.stock || 0;
  const maxStock = stockLevel > 0 ? Math.max(stockLevel * 2, 100) : 100; // Fake capacity based on current stock for demo if no hard capacity exists
  const stockPercentage = Math.min((stockLevel / maxStock) * 100, 100);
  const lowStockThreshold =
    product.minOrderQuantity > 0 ? product.minOrderQuantity * 2 : 10;

  // Determine color coding based on stock level against threshold
  let stockColorClass = "bg-green-500";
  let statusBadgeClass =
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
  let statusText = "ACTIVE";

  if (!product.isActive) {
    stockColorClass = "bg-primary";
    statusBadgeClass =
      "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
    statusText = "PAUSED";
  } else if (stockLevel === 0) {
    stockColorClass = "bg-red-500";
    statusBadgeClass =
      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
    statusText = "OUT OF STOCK";
  } else if (stockLevel <= lowStockThreshold) {
    stockColorClass = "bg-amber-500";
    // We keep status as ACTIVE but warn on stock bar
  }

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {product.name}
          </span>
          <span
            className="text-[11px] text-slate-400 truncate max-w-[200px]"
            title={product.id}
          >
            SKU-{product.id.split("-")[0].toUpperCase()}
          </span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden min-w-[100px]">
            <div
              className={`h-full ${stockColorClass}`}
              style={{ width: `${stockPercentage}%` }}
            ></div>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {stockLevel}
          </span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-slate-400">
            location_on
          </span>
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {/* We don't have warehouse zones in the V1 model yet, defaulting to dynamic placeholder based on category */}
            Zone {product.categoryTag?.slice(0, 2).toUpperCase() || "A"}
          </span>
        </div>
      </td>

      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium capitalize">
        {product.unit.toLowerCase()}
      </td>

      <td className="px-6 py-4">
        <span
          className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${statusBadgeClass}`}
        >
          {statusText.replace(/_/g, " ")}
        </span>
      </td>

      <td className="px-6 py-4 text-right">
        <button
          onClick={() => onQuickEdit?.(product.id)}
          className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-bold border border-primary transition-colors"
        >
          Quick Edit
        </button>
      </td>
    </tr>
  );
}
