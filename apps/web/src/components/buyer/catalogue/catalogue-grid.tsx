import React from "react";
import Link from "next/link";
import type { Product } from "@hardware-os/shared";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { StarRating } from "@/components/ui/star-rating";

interface Props {
  products: Product[];
  setSearchQuery: (val: string) => void;
  setActiveCategory: (val: string) => void;
  buyerType?: "CONSUMER" | "BUSINESS";
}

export function CatalogueGrid({
  products,
  setSearchQuery,
  setActiveCategory,
  buyerType = "BUSINESS",
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

            {/* Price Details — unified priceKobo for both CONSUMER and BUSINESS */}
            {(() => {
              const priceKobo =
                buyerType === "CONSUMER" && p.retailPriceKobo
                  ? p.retailPriceKobo
                  : p.pricePerUnitKobo || (p as any).retailPriceKobo;

              if (priceKobo) {
                return (
                  <div className="mt-2.5">
                    <div className="text-sm sm:text-lg font-black text-navy-dark dark:text-emerald-400">
                      {(Number(priceKobo) / 100).toLocaleString("en-NG", {
                        style: "currency",
                        currency: "NGN",
                        minimumFractionDigits: 0,
                      })}
                    </div>
                    <div className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                      Per {p.unit}
                    </div>
                  </div>
                );
              }
              return (
                <div className="mt-2.5 text-[10px] font-black text-slate-400 italic uppercase tracking-widest">
                  Quote Required
                </div>
              );
            })()}

            {/* CTA — uses same priceKobo logic as display above */}
            <div className="mt-4">
              {(() => {
                const priceKobo =
                  buyerType === "CONSUMER" && p.retailPriceKobo
                    ? p.retailPriceKobo
                    : p.pricePerUnitKobo || (p as any).retailPriceKobo;
                return priceKobo ? (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        const { addToCart } =
                          await import("@/lib/api/cart.api");
                        const { toast } = await import("sonner");
                        await addToCart(p.id, 1);
                        toast.success(`${p.name} added to cart`);
                      } catch (err: any) {
                        const { toast } = await import("sonner");
                        toast.error(err.message || "Failed to add to cart");
                      }
                    }}
                    className="w-full bg-primary hover:bg-orange-600 text-white text-[10px] sm:text-xs font-black py-2.5 rounded-lg uppercase tracking-widest text-center block transition-all active:scale-95 shadow-sm"
                  >
                    Add to Cart
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] sm:text-xs font-black py-2.5 rounded-lg uppercase tracking-widest text-center block cursor-not-allowed"
                  >
                    Unavailable
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
