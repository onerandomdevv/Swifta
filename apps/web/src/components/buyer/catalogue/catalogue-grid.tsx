import React from "react";
import Link from "next/link";
import type { Product } from "@hardware-os/shared";

interface Props {
  products: Product[];
  setSearchQuery: (val: string) => void;
  setActiveCategory: (val: string) => void;
}

export function CatalogueGrid({
  products,
  setSearchQuery,
  setActiveCategory,
}: Props) {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center space-y-6 animate-in zoom-in duration-500">
        <div className="size-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto grayscale opacity-50">
          <span className="material-symbols-outlined text-5xl text-slate-300">
            search_off
          </span>
        </div>
        <div>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            No materials found
          </h4>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
            Adjust your filters or try a different search term.
          </p>
        </div>
        <button
          onClick={() => {
            setSearchQuery("");
            setActiveCategory("All");
          }}
          className="text-primary font-black text-xs uppercase tracking-[0.2em] hover:underline decoration-2 underline-offset-8"
        >
          Clear All Search Filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((p) => (
        <div
          key={p.id}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col group hover:shadow-md transition-shadow"
        >
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
            {p.imageUrl ? (
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url("${p.imageUrl}")` }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[80px] group-hover:scale-105 transition-transform duration-500">
                  inventory_2
                </span>
              </div>
            )}
            {/* Category Badge */}
            <span className="absolute top-3 right-3 bg-slate-900 text-white text-[10px] font-black uppercase px-2 py-1 tracking-wider">
              {p.categoryTag}
            </span>
          </div>

          {/* Product Details */}
          <div className="p-4 flex flex-col flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase">
              {p.name}
            </h3>
            <p className="text-xs font-medium text-primary mt-1">
              {p.description || p.categoryTag}
            </p>

            {/* Merchant Info */}
            {p.merchantProfile && (
              <Link
                href={`/buyer/merchants/${p.merchantProfile.id}`}
                className="flex items-center gap-1.5 mt-3 group/m hover:opacity-80 transition-opacity"
              >
                {p.merchantProfile.verification === "VERIFIED" && (
                  <span className="material-symbols-outlined text-green-500 text-sm">
                    verified
                  </span>
                )}
                <span className="text-[11px] font-bold text-primary dark:text-primary-light truncate group-hover/m:underline decoration-1 underline-offset-2">
                  {p.merchantProfile.businessName}
                </span>
              </Link>
            )}

            {/* Specs Table */}
            <div className="mt-4 mb-6 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="grid grid-cols-2 text-[10px] p-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 uppercase font-bold tracking-tighter">
                  Min. Order
                </span>
                <span className="text-right font-black text-slate-900 dark:text-white">
                  {p.minOrderQuantity} {p.unit.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 text-[10px] p-2">
                <span className="text-slate-500 uppercase font-bold tracking-tighter">
                  Unit
                </span>
                <span className="text-right font-black text-slate-900 dark:text-white">
                  {p.unit.toUpperCase()}
                </span>
              </div>
            </div>

            {/* CTA */}
            <Link
              href={`/buyer/rfqs/new?productId=${p.id}`}
              className="mt-auto w-full bg-primary text-white text-xs font-bold py-3 uppercase tracking-widest hover:bg-orange-600 transition-colors text-center block"
            >
              Request Quote
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
