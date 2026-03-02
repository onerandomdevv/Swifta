import React from "react";
import type { Product } from "@hardware-os/shared";

interface StorefrontCardProps {
  product: Product;
}

export function StorefrontCard({ product }: StorefrontCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden group hover:border-primary transition-all shadow-sm">
      {/* Product Image */}
      <div className="h-48 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
        {product.imageUrl ? (
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={product.imageUrl}
            alt={product.name}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[60px]">
              inventory_2
            </span>
          </div>
        )}
        {/* Category Badge */}
        <span className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">
          {product.categoryTag}
        </span>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1 leading-tight">
          {product.name}
        </h4>
        <p className="text-[11px] text-slate-500 mb-4 line-clamp-1">
          {product.description || `${product.unit} • ${product.categoryTag}`}
        </p>

        {/* Disabled CTA */}
        <button
          className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-[11px] font-black uppercase tracking-widest cursor-not-allowed mb-1"
          disabled
        >
          Request Quote
        </button>
        <p className="text-[9px] text-center text-slate-400 italic">
          Visible to buyers only
        </p>
      </div>
    </div>
  );
}
