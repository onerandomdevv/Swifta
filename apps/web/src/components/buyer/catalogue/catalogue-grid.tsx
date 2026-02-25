import React from "react";
import Link from "next/link";
import type { Product } from "@hardware-os/shared";

interface Props {
  products: Product[];
  setSearchQuery: (val: string) => void;
  setActiveCategory: (val: string) => void;
}

const categoryIcons: Record<string, string> = {
  "Building Materials": "construction",
  Electrical: "electrical_services",
  Plumbing: "plumbing",
  Tools: "hardware",
  Safety: "health_and_safety",
};

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
          <h4 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
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
          className="text-accent-orange font-black text-xs uppercase tracking-[0.2em] hover:underline decoration-2 underline-offset-8"
        >
          Clear All Search Filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products?.map((p) => (
        <div
          key={p.id}
          className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
        >
          {/* Image Container */}
          <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
            {p.imageUrl ? (
              <img
                src={p.imageUrl}
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[80px] group-hover:scale-105 transition-transform duration-700 leading-none">
                {categoryIcons[p.categoryTag] || "inventory_2"}
              </span>
            )}

            {/* Quick Action Overlay (Optional/Utilitarian) */}
            <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-400 text-sm">
                favorite
              </span>
            </div>
          </div>

          {/* Data Container */}
          <div className="p-4 flex flex-col flex-1">
            <div className="mb-2 min-h-[4rem]">
              <h3
                className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2"
                title={p.name}
              >
                {p.name}
              </h3>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-500 mt-1">
                {p.unit}
              </p>
            </div>

            <div className="flex items-center gap-1.5 mb-4">
              <span className="material-symbols-outlined text-accent-orange text-xs">
                store
              </span>
              <Link
                href={p.merchant ? `/merchants/${p.merchant.id}` : "#"}
                className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate hover:text-accent-orange transition-colors"
              >
                {p.merchant ? p.merchant.businessName : "Unknown Supplier"}
              </Link>
            </div>

            {/* Strict V1 CTA: Request Quote (No Cart/Buy Now) */}
            <Link
              href={`/buyer/rfqs/new?productId=${p.id}`}
              className="mt-auto w-full bg-accent-orange text-white py-2.5 rounded-lg text-xs font-bold hover:bg-orange-600 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">
                request_quote
              </span>
              Request Quote
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
