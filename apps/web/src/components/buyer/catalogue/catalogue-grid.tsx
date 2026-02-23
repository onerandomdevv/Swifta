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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products?.map((p) => (
        <div
          key={p.id}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col group"
        >
          <div className="aspect-square bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden flex items-center justify-center p-8">
            {p.imageUrl ? (
              <img
                src={p.imageUrl}
                alt={p.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <span className="material-symbols-outlined text-slate-200 dark:text-slate-700 text-[120px] group-hover:scale-110 transition-transform duration-700 leading-none">
                {categoryIcons[p.categoryTag] || "inventory_2"}
              </span>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-navy-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <Link
                href={`/buyer/rfqs/new?productId=${p.id}`}
                className="size-14 bg-white text-navy-dark rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined font-black">
                  add_shopping_cart
                </span>
              </Link>
            </div>
          </div>

          <div className="p-8 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              <span>{p.categoryTag}</span>
              <span className="text-slate-200">•</span>
              <span>{p.unit}</span>
            </div>

            {p.merchant && (
              <Link
                href={`/merchants/${p.merchant.id}`}
                className="mt-1 mb-2 text-[10px] font-black text-accent-orange hover:underline decoration-2 underline-offset-4 uppercase tracking-widest block truncate"
              >
                By {p.merchant.businessName}
              </Link>
            )}

            <h3 className="font-black text-navy-dark dark:text-white text-lg leading-tight mb-4 line-clamp-2 min-h-[3.5rem] uppercase tracking-tight">
              {p.name}
            </h3>

            <div className="mt-auto mb-8 p-3 rounded-xl flex items-center gap-3 bg-slate-50 text-slate-500 dark:bg-slate-800/50 transition-colors">
              <span className="material-symbols-outlined text-xl">
                inventory_2
              </span>
              <p className="text-[10px] font-black uppercase tracking-widest">
                Min Order: {p.minOrderQuantity} {p.unit}
              </p>
            </div>

            <Link
              href={`/buyer/rfqs/new?productId=${p.id}`}
              className="w-full bg-accent-orange text-white font-black py-4 rounded-2xl text-[10px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 shadow-xl shadow-accent-orange/20 hover:bg-orange-600 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">
                request_quote
              </span>
              Request Quotation
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
