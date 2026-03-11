import React from "react";
import Link from "next/link";
import { PriceType, type Product } from "@hardware-os/shared";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { StarRating } from "@/components/ui/star-rating";

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
            No products found
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
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
      {products.map((p) => (
        <div
          key={p.id}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col group hover:shadow-md transition-shadow rounded-xl overflow-hidden shadow-sm"
        >
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800/50">
            {p.imageUrl ? (
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url("${p.imageUrl}")` }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-4xl sm:text-[80px] group-hover:scale-105 transition-transform duration-500">
                  inventory_2
                </span>
              </div>
            )}
            {/* Category Badge */}
            <span className="absolute top-2 left-2 sm:top-3 sm:right-3 sm:left-auto bg-slate-900/80 backdrop-blur-sm text-white text-[8px] sm:text-[10px] font-black uppercase px-2 py-1 tracking-wider rounded-sm sm:rounded-none">
              {p.categoryTag}
            </span>
          </div>

          {/* Product Details */}
          <div className="p-3 sm:p-4 flex flex-col flex-1">
            <h3 className="text-[11px] sm:text-sm font-black text-slate-900 dark:text-slate-100 uppercase leading-tight line-clamp-2 min-h-[2.5em]">
              {p.name}
            </h3>

            {/* Merchant Info */}
            {p.merchantProfile && (
              <Link
                href={`/buyer/merchants/${p.merchantProfile.id}`}
                className="flex items-center gap-1 mt-2 group/m hover:opacity-80 transition-opacity"
              >
                <div className="shrink-0 scale-75 sm:scale-100 origin-left">
                  <VerificationBadge
                    tier={p.merchantProfile.verificationTier as any}
                  />
                </div>
                <span className="text-[9px] sm:text-[11px] font-black text-primary dark:text-primary-light truncate group-hover/m:underline underline-offset-2 uppercase tracking-tight">
                  {p.merchantProfile.businessName}
                </span>
              </Link>
            )}

            {/* Price Details */}
            <div className="mt-3 space-y-2">
              {p.retailPriceKobo && (
                <div className="flex justify-between items-end border-b border-slate-50 dark:border-slate-800 pb-1">
                  <div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      Retail
                    </div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-500">
                      Min: {p.minOrderQuantityConsumer} {p.unit}
                    </div>
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                    {(Number(p.retailPriceKobo) / 100).toLocaleString("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      minimumFractionDigits: 0,
                    })}
                  </div>
                </div>
              )}

              {p.wholesalePriceKobo && (
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[8px] font-black text-primary uppercase tracking-widest">
                      Wholesale
                    </div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-500">
                      Min: {p.minOrderQuantity} {p.unit}
                    </div>
                  </div>
                  <div className="text-sm font-black text-primary">
                    {(Number(p.wholesalePriceKobo) / 100).toLocaleString(
                      "en-NG",
                      {
                        style: "currency",
                        currency: "NGN",
                        minimumFractionDigits: 0,
                      },
                    )}
                  </div>
                </div>
              )}

              {!p.retailPriceKobo && !p.wholesalePriceKobo && (
                <div className="text-[10px] font-black text-slate-400 italic uppercase tracking-widest py-2">
                  Quote Required
                </div>
              )}
            </div>

            {/* CTA Container */}
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={`/buyer/products/${p.id}`}
                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-primary text-slate-900 dark:text-white text-[9px] sm:text-[10px] font-black py-2 rounded-lg uppercase tracking-widest text-center transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">visibility</span>
                View Product details
              </Link>
              <div className="grid grid-cols-2 gap-2">
                {p.retailPriceKobo && (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      handleAdd(p, PriceType.RETAIL, p.minOrderQuantityConsumer);
                    }}
                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-[8px] sm:text-[9px] font-black py-2 rounded-lg uppercase tracking-widest text-center transition-all active:scale-95 flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">add_shopping_cart</span>
                    Retail
                  </button>
                )}

                {p.wholesalePriceKobo ? (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      handleAdd(p, PriceType.WHOLESALE, p.minOrderQuantity);
                    }}
                    className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-white dark:bg-primary-dark/20 dark:hover:bg-primary dark:text-primary-light text-[8px] sm:text-[9px] font-black py-2 rounded-lg uppercase tracking-widest text-center transition-all active:scale-95 flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">add_shopping_cart</span>
                    Wholesale
                  </button>
                ) : (
                  <div className="w-full" /> 
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function handleAdd(product: Product, priceType: PriceType, qty: number) {
  try {
    const { addToCart } = await import("@/lib/api/cart.api");
    const { toast } = await import("sonner");
    await addToCart(product.id, qty, priceType);
    toast.success(`${product.name} added as ${priceType.toLowerCase()}`);
  } catch (err: any) {
    const { toast } = await import("sonner");
    toast.error(err.message || "Failed to add to cart");
  }
}
