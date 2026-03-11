"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PriceType, type Product } from "@hardware-os/shared";
import { VerificationBadge } from "@/components/ui/verification-badge";

interface Props {
  product: Product;
  onQuickBuy: (product: Product) => void;
  isSaved?: boolean;
  onToggleSave?: (productId: string) => void;
}

function timeAgo(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function formatNaira(kobo: number | bigint): string {
  const naira = Number(kobo) / 100;
  return `₦${naira.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function ProductFeedCard({ product: p, onQuickBuy, isSaved = false, onToggleSave }: Props) {
  const [addingToCart, setAddingToCart] = useState(false);

  const wholesalePrice = p.wholesalePriceKobo
    ? Number(p.wholesalePriceKobo)
    : null;
  const retailPrice = p.retailPriceKobo ? Number(p.retailPriceKobo) : null;
  const displayPrice = wholesalePrice || retailPrice || 0;
  const hasRetail = retailPrice && wholesalePrice && retailPrice !== wholesalePrice;

  const merchant = p.merchantProfile;
  const rating = merchant?.averageRating || 0;
  const reviewCount = merchant?.reviewCount || 0;

  async function handleAddToCart() {
    setAddingToCart(true);
    try {
      const { addToCart } = await import("@/lib/api/cart.api");
      const { toast } = await import("sonner");

      const priceType = p.retailPriceKobo ? PriceType.RETAIL : PriceType.WHOLESALE;
      const qty = priceType === PriceType.RETAIL
        ? (p.minOrderQuantityConsumer || 1)
        : (p.minOrderQuantity || 1);

      await addToCart(p.id, qty, priceType);
      toast.success(`${p.name} added to cart`);
    } catch (err: any) {
      const { toast } = await import("sonner");
      toast.error(err.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  }

  return (
    <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500 flex flex-col group relative">
      {/* ─── Card Header: Merchant Info ─── */}
      <div className="flex items-center gap-2.5 px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30 backdrop-blur-sm">
        <Link
          href={merchant ? `/buyer/merchants/${merchant.id}` : "#"}
          className="flex items-center gap-2.5 flex-1 min-w-0 group/m"
        >
          {/* Merchant Avatar */}
          <div className="size-9 sm:size-10 rounded-2xl bg-white dark:bg-slate-800 overflow-hidden shrink-0 ring-1 ring-slate-100 dark:ring-slate-700 shadow-sm group-hover/m:rotate-[10deg] transition-transform duration-500">
            {merchant?.profileImage ? (
              <img
                src={merchant.profileImage}
                alt={merchant.businessName}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-400 text-sm">
                  storefront
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white truncate group-hover/m:text-primary transition-colors">
                {merchant?.businessName || "Merchant"}
              </span>
              {merchant && (
                <div className="shrink-0 scale-[0.65] origin-left">
                  <VerificationBadge
                    tier={merchant.verificationTier as any}
                  />
                </div>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
              {p.createdAt ? timeAgo(p.createdAt) : ""}
            </span>
          </div>
        </Link>

        {/* Category tag */}
        {p.categoryTag && (
          <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-bold text-slate-500 uppercase tracking-wider rounded-md shrink-0">
            {p.categoryTag}
          </span>
        )}
      </div>

      {/* ─── Product Image ─── */}
      <Link
        href={`/buyer/products/${p.id}`}
        className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800/50 cursor-pointer"
      >
        {p.imageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url("${p.imageUrl}")` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-5xl sm:text-7xl group-hover:scale-105 transition-transform duration-500">
              inventory_2
            </span>
          </div>
        )}

        {/* Hot Deal badge if discount exists */}
        {hasRetail && (
          <span className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-accent-orange text-white text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-lg tracking-wider">
            Save {Math.round(((retailPrice - wholesalePrice) / retailPrice) * 100)}%
          </span>
        )}

        {/* Heart / Save toggle */}
        {onToggleSave && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave(p.id);
            }}
            className={`absolute bottom-2 right-2 sm:bottom-3 sm:right-3 size-8 sm:size-9 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 ${
              isSaved
                ? "bg-red-500 text-white"
                : "bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-red-500 backdrop-blur-sm"
            }`}
            title={isSaved ? "Remove from saved" : "Save product"}
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>
              favorite
            </span>
          </button>
        )}
      </Link>

      {/* ─── Card Footer: Details + Actions ─── */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Product Name */}
        <Link href={`/buyer/products/${p.id}`}>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight line-clamp-2 min-h-[2.2em] hover:text-primary transition-colors">
            {p.name}
          </h3>
        </Link>

        {/* Price Line */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-sm sm:text-base font-black text-primary">
            {formatNaira(displayPrice)}
          </span>
          {p.unit && (
            <span className="text-[10px] text-slate-400 font-medium">
              / {p.unit}
            </span>
          )}
          {hasRetail && (
            <span className="text-[10px] sm:text-xs text-slate-400 line-through font-medium">
              {formatNaira(retailPrice)}
            </span>
          )}
        </div>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-amber-500 text-[10px]">⭐</span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300">
              {rating.toFixed(1)}
            </span>
            <span className="text-[9px] text-slate-400">
              ({reviewCount} reviews)
            </span>
          </div>
        )}

        {/* Spacer to push actions to bottom */}
        <div className="flex-1 min-h-2" />

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onQuickBuy(p)}
            className="flex-1 h-9 sm:h-10 bg-primary hover:bg-primary-dark text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">
              bolt
            </span>
            Quick Buy
          </button>

          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="h-9 sm:h-10 px-3 sm:px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] sm:text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 hover:border-primary"
          >
            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">
              {addingToCart ? "hourglass_top" : "add_shopping_cart"}
            </span>
            <span className="hidden sm:inline">Cart</span>
          </button>
        </div>
      </div>
    </article>
  );
}
