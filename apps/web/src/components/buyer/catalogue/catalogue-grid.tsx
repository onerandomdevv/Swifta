import React from "react";
import Link from "next/link";
import { PriceType, type Product } from "@hardware-os/shared";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { StarRating } from "@/components/ui/star-rating";

interface Props {
  products: Product[];
  setSearchQuery: (val: string) => void;
  setActiveCategory: (val: string) => void;
  isOwner?: boolean;
  onDelete?: (product: Product) => void;
}

export function CatalogueGrid({
  products,
  setSearchQuery,
  setActiveCategory,
  isOwner,
  onDelete,
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((p) => (
        <div
          key={p.id}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col group hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden shadow-sm"
        >
          {/* Product Image - Absolute Square */}
          <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800/50">
            {p.imageUrl ? (
              <img
                src={p.imageUrl}
                alt={p.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-200 dark:text-slate-700 text-[80px]">
                  inventory_2
                </span>
              </div>
            )}
            
            {/* Verification & Floating Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#0F2B4C] dark:text-white text-[9px] font-black uppercase px-3 py-1.5 tracking-wider rounded-lg shadow-sm border border-slate-100/50 dark:border-slate-800/50">
                {p.categoryTag}
              </span>
            </div>
          </div>

          {/* Product Details */}
          <div className="p-6 flex flex-col flex-1">
            <div className="flex justify-between items-start gap-4">
              <h3 className="text-[17px] font-black text-[#0F2B4C] dark:text-white uppercase leading-snug tracking-tighter line-clamp-2 min-h-[2.4em] flex-1">
                {p.name}
              </h3>
              
              {isOwner && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete?.(p);
                  }}
                  className="size-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shrink-0 active:scale-90"
                  title="Delete Product"
                >
                  <span className="material-symbols-outlined text-xl">
                    delete
                  </span>
                </button>
              )}
            </div>

            {/* Short Product Description */}
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 overflow-hidden">
              {p.description || "Premium quality supplies for professional construction and industrial hardware needs."}
            </p>

            <div className="mt-auto pt-6">
              {/* Price section - Professional Black */}
              <div className="mb-2.5">
                <p className="text-xl font-black text-slate-950 dark:text-white tabular-nums tracking-tighter">
                  {(Number(p.retailPriceKobo || p.wholesalePriceKobo || 0) / 100).toLocaleString("en-NG", {
                    style: "currency",
                    currency: "NGN",
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>

              {/* CTA Row - 3 Components */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/buyer/products/${p.id}`}
                  className="flex-[3] bg-[#00D084] hover:bg-[#00B873] text-white text-[11px] font-black py-4 rounded-xl uppercase tracking-widest text-center shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
                >
                  Buy Now
                </Link>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleAdd(p, PriceType.RETAIL, p.minOrderQuantityConsumer);
                  }}
                  className="size-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-[#0F2B4C] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  title="Add to Cart"
                >
                  <span className="material-symbols-outlined text-xl">shopping_cart</span>
                </button>

                <button 
                  className="size-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-[#0F2B4C] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  title="Save for Later"
                >
                  <span className="material-symbols-outlined text-xl">bookmark</span>
                </button>
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
