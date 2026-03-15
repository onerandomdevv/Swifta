import React from "react";
import { formatKobo } from "@hardware-os/shared";

interface Props {
  item: any;
  onOrder: (item: any) => void;
  isRecommended?: boolean;
}

export function WholesaleCard({ item, onOrder, isRecommended }: Props) {
  return (
    <div
      className={`bg-surface rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all group ${
        isRecommended
          ? "border-amber-500/20"
          : "border-border"
      }`}
    >
      <div className="h-48 bg-background-secondary relative flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-foreground-muted/40">
          inventory
        </span>
        <div className="absolute top-4 left-4 flex gap-2">
          {isRecommended && (
            <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-md flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">
                auto_awesome
              </span>
              Recommended
            </span>
          )}
          <span className="px-2 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-md">
            Wholesale
          </span>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          <p className="text-xs text-foreground-muted font-medium line-clamp-1">
            Sold by {item.supplier?.companyName || "Manufacturer"}
          </p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
              Starting at
            </label>
            <p className="text-xl font-black text-primary tabular-nums">
              {formatKobo(item.wholesalePriceKobo)}
            </p>
          </div>
          <div className="text-right">
            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest block">
              Min. Order
            </label>
            <p className="text-sm font-bold text-foreground-secondary">
              {item.minOrderQty} {item.unit}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onOrder(item)}
            className="flex-1 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">
              shopping_cart
            </span>
            Order Now
          </button>
        </div>
      </div>
    </div>
  );
}
