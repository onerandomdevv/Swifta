"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PriceType, type Product } from "@hardware-os/shared";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { cn, optimizeCloudinaryUrl } from "@/lib/utils";
import { toast } from "sonner";

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
  const [copied, setCopied] = useState(false);

  const wholesalePrice = p.wholesalePriceKobo ? Number(p.wholesalePriceKobo) : null;
  const retailPrice = p.retailPriceKobo ? Number(p.retailPriceKobo) : null;
  const displayPrice = retailPrice || wholesalePrice || 0;
  
  const hasWholesale = !!p.wholesalePriceKobo;
  
  const merchant = p.merchantProfile;
  const images = p.imageUrl ? [p.imageUrl] : [];

  async function handleAddToCart() {
    setAddingToCart(true);
    try {
      const { addToCart } = await import("@/lib/api/cart.api");
      const priceType = retailPrice ? PriceType.RETAIL : PriceType.WHOLESALE;
      const qty = priceType === PriceType.RETAIL
        ? (p.minOrderQuantityConsumer || 1)
        : (p.minOrderQuantity || 1);

      await addToCart(p.id, qty, priceType);
      toast.success(`${p.name} added to cart`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  }

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!p.productCode) return;
    navigator.clipboard.writeText(p.productCode);
    setCopied(true);
    toast.success("Product code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="w-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col group transition-all duration-300 hover:shadow-md">
      {/* Merchant Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-800">
        <Link 
          href={merchant ? `/buyer/merchants/${merchant.id}` : "#"}
          className="flex items-center gap-2 group/m"
        >
          <div 
            className="size-8 rounded-full bg-slate-100 bg-cover bg-center shrink-0 border border-slate-200 dark:border-slate-700"
            style={{ backgroundImage: merchant?.profileImage ? `url('${merchant.profileImage}')` : undefined }}
          >
            {!merchant?.profileImage && (
              <div className="size-full flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-400 text-xs">storefront</span>
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-slate-900 dark:text-slate-100 font-semibold text-xs truncate group-hover/m:text-primary transition-colors">
              {merchant?.businessName || "Merchant Name"}
            </span>
            <span className="text-slate-400 text-[9px] font-medium">
              {p.createdAt ? timeAgo(p.createdAt) : "Recently"}
            </span>
          </div>
        </Link>
      </div>

      {/* Product Image Section */}
      <Link href={`/buyer/products/${p.id}`} className="relative aspect-square w-full overflow-hidden bg-slate-50 dark:bg-slate-800 shrink-0">
        {p.imageUrl ? (
          <img 
            alt={p.name} 
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
            src={optimizeCloudinaryUrl(p.imageUrl, 400) || p.imageUrl}
          />
        ) : (
          <div className="size-full flex items-center justify-center">
             <span className="material-symbols-outlined text-slate-200 dark:text-slate-700 text-5xl">
              inventory_2
            </span>
          </div>
        )}
      </Link>

      {/* Content Body */}
      <div className="p-4 space-y-3 flex flex-col flex-1">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Link href={`/buyer/products/${p.id}`}>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate hover:text-primary transition-colors">
                  {p.name}
                </h3>
              </Link>
              {p.categoryTag && (
                <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                  {p.categoryTag}
                </p>
              )}
            </div>
            
            <div className="flex items-center shrink-0">
              {p.productCode && (
                <button 
                  onClick={handleCopyCode}
                  className={cn(
                    "transition-all flex items-center justify-center size-7 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800",
                    copied ? "text-primary" : "text-slate-300 hover:text-primary"
                  )}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copied ? "check" : "content_copy"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {p.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed h-[2.5em]">
              {p.description}
            </p>
          )}
        </div>

        {/* Pricing Section */}
        <div className="pt-2 border-t border-slate-50 dark:border-slate-800">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-primary">{formatNaira(displayPrice)}</span>
            {p.unit && <span className="text-slate-400 text-[10px] font-bold">/ {p.unit}</span>}
          </div>
          {hasWholesale && (
             <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-slate-400 tracking-wider mt-0.5">
                <span className="material-symbols-outlined text-[12px]">inventory</span>
                Wholesale
             </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Action Bar */}
        <div className="flex gap-2 pt-2">
          <button 
            onClick={() => onQuickBuy(p)}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-lg transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Buy Now</span>
          </button>
          
          <button 
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="size-10 shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">
              {addingToCart ? "sync" : "add_shopping_cart"}
            </span>
          </button>

          {onToggleSave && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave(p.id);
              }}
              className={cn(
                "size-10 shrink-0 flex items-center justify-center rounded-lg transition-all active:scale-95 border",
                isSaved 
                  ? "bg-red-50 text-red-500 border-red-100 shadow-sm" 
                  : "bg-white dark:bg-slate-900 text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
              )}
            >
              <span 
                className="material-symbols-outlined text-[20px]" 
                style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
              >
                bookmark
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}


