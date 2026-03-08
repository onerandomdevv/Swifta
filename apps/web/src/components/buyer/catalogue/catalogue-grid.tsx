import React from "react";
import Link from "next/link";
import type { Product } from "@hardware-os/shared";
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
            {Number(p.minOrderQuantity) === 1 && (
              <span className="absolute top-10 right-3 bg-emerald-600 text-white text-[8px] font-black uppercase px-2 py-1 tracking-wider">
                Individual Friendly
              </span>
            )}
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
                <VerificationBadge
                  tier={p.merchantProfile.verificationTier as any}
                />
                {(p.merchantProfile.verificationTier === "VERIFIED" ||
                  p.merchantProfile.verificationTier === "TRUSTED") && (
                  <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                    Direct Pay
                  </span>
                )}
                <span className="text-[11px] font-bold text-primary dark:text-primary-light truncate group-hover/m:underline decoration-1 underline-offset-2">
                  {p.merchantProfile.businessName}
                </span>
                {p.merchantProfile.averageRating !== undefined &&
                  p.merchantProfile.averageRating > 0 && (
                    <div className="flex items-center gap-0.5 ml-1">
                      <span className="text-[10px] font-black text-amber-500">
                        {Number(p.merchantProfile.averageRating).toFixed(1)}
                      </span>
                      <span className="material-symbols-outlined text-[10px] text-amber-400 fill-amber-400">
                        star
                      </span>
                    </div>
                  )}
              </Link>
            )}

            {/* Stock Availability Badge */}
            {(p as any).stockAvailability &&
              (p as any).stockAvailability !== "OUT_OF_STOCK" && (
                <span
                  className={`inline-block mt-2 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider w-fit ${
                    (p as any).stockAvailability === "IN_STOCK"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {(p as any).stockAvailability === "IN_STOCK"
                    ? "In Stock"
                    : "Low Stock"}
                </span>
              )}
            {(p as any).stockAvailability === "OUT_OF_STOCK" && (
              <span className="inline-block mt-2 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider w-fit bg-red-100 text-red-700">
                Out of Stock
              </span>
            )}

            {/* Price Details */}
            {p.pricePerUnitKobo ? (
              <div className="mt-3">
                <span className="text-lg font-black text-navy-dark dark:text-emerald-400">
                  {(Number(p.pricePerUnitKobo) / 100).toLocaleString("en-NG", {
                    style: "currency",
                    currency: "NGN",
                  })}
                </span>
                <span className="text-[10px] text-slate-500 font-bold ml-1 uppercase tracking-widest">
                  / {p.unit}
                </span>
              </div>
            ) : (
              <div className="mt-3 text-xs font-bold text-slate-400 italic">
                Request Quote for Price
              </div>
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
            </div>

            {/* CTA */}
            {p.pricePerUnitKobo ? (
              <Link
                href={`/buyer/checkout/${p.id}`}
                className={`mt-auto w-full text-white text-xs font-black py-3 uppercase tracking-widest text-center block transition-colors ${
                  (p as any).stockAvailability === "OUT_OF_STOCK"
                    ? "bg-slate-300 cursor-not-allowed pointer-events-none"
                    : "bg-navy-dark hover:bg-navy"
                }`}
              >
                Buy Now
              </Link>
            ) : (
              <Link
                href={`/buyer/rfqs/new?productId=${p.id}`}
                className="mt-auto w-full bg-primary text-white text-xs font-bold py-3 uppercase tracking-widest hover:bg-orange-600 transition-colors text-center block"
              >
                Request Quote
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
