"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PriceType, type Product } from "@twizrr/shared";
import { toast } from "sonner";
import { cn, formatKobo, optimizeCloudinaryUrl } from "@/lib/utils";
import { VerificationBadge } from "@/components/shared/verification-badge";

interface ProductCardProps {
  product: Product;
  isOwner?: boolean;
  showMerchant?: boolean;
  onQuickBuy?: (product: Product) => void;
  isSaved?: boolean;
  onToggleSave?: (productId: string) => void;
  className?: string;
}

function timeAgo(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export function ProductCard({
  product: p,
  isOwner = false,
  showMerchant = true,
  onQuickBuy,
  isSaved = false,
  onToggleSave,
  className,
}: ProductCardProps) {
  const router = useRouter();
  const [addingToCart, setAddingToCart] = useState(false);
  const [copied, setCopied] = useState(false);

  const retailPrice = Number(p.retailPriceKobo || p.pricePerUnitKobo || 0);
  const wholesalePrice = p.wholesalePriceKobo ? Number(p.wholesalePriceKobo) : null;
  const displayPrice = retailPrice || wholesalePrice || 0;
  const stock = p.stockCache?.stock ?? 0;

  const merchant = p.merchantProfile;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setAddingToCart(true);
    try {
      const { addToCart } = await import("@/lib/api/cart.api");
      const priceType = PriceType.RETAIL;
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
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!p.productCode) return;
    navigator.clipboard.writeText(p.productCode);
    setCopied(true);
    toast.success("Product code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const getStockBadge = () => {
    if (stock <= 0) {
      return (
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm text-rose-500 border border-rose-100 rounded-md shadow-sm z-10">
          <span className="material-symbols-outlined text-xs font-bold">error</span>
          <span className="text-[9px] font-bold uppercase tracking-wider">Out of Stock</span>
        </div>
      );
    }
    if (stock <= 10) {
      return (
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm text-amber-500 border border-amber-100 rounded-md shadow-sm z-10">
          <span className="material-symbols-outlined text-xs font-bold">warning</span>
          <span className="text-[9px] font-bold uppercase tracking-wider">Low Stock</span>
        </div>
      );
    }
    return null;
  };

  const detailUrl = isOwner ? `/merchant/products/${p.id}` : `/buyer/products/${p.id}`;

  return (
    <article 
      onClick={() => router.push(detailUrl)}
      className={cn("w-full bg-surface rounded-xl shadow-sm border border-border flex flex-col group transition-all duration-300 hover:shadow-md cursor-pointer overflow-hidden", className)}
    >
      {/* Merchant Header (Optional) */}
      {showMerchant && merchant && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
          <Link 
            href={`/buyer/merchants/${merchant.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 group/m"
          >
            <div 
              className="size-7 rounded-lg bg-background-secondary bg-cover bg-center shrink-0 border border-border"
              style={{ backgroundImage: merchant.profileImage ? `url('${merchant.profileImage}')` : undefined }}
            >
              {!merchant.profileImage && (
                <div className="size-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-foreground-muted text-[10px]">storefront</span>
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-foreground font-bold text-[11px] truncate group-hover/m:text-primary transition-colors">
                {merchant.businessName}
              </span>
              {merchant.verificationTier && (
                <VerificationBadge tier={merchant.verificationTier} size="xs" showLabel={false} />
              )}
              <span className="text-foreground-muted text-[9px] font-medium">
                {p.createdAt ? timeAgo(p.createdAt) : "Recently"}
              </span>
            </div>
          </Link>
        </div>
      )}

      {/* Product Image Section */}
      <div className="relative aspect-square w-full overflow-hidden bg-background-secondary shrink-0">
        {p.imageUrl ? (
          <img 
            alt={p.name} 
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
            src={optimizeCloudinaryUrl(p.imageUrl, 400) || p.imageUrl}
          />
        ) : (
          <div className="size-full flex items-center justify-center">
             <span className="material-symbols-outlined text-foreground-muted text-5xl opacity-20">
              inventory_2
            </span>
          </div>
        )}
        
        {getStockBadge()}

        {p.wholesaleDiscountPercent && p.wholesaleDiscountPercent > 0 && isOwner && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-primary text-white text-[9px] font-bold rounded-md shadow-sm z-10">
            -{p.wholesaleDiscountPercent}%
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-4 space-y-3 flex flex-col flex-1">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                {p.name}
              </h3>
              {p.categoryTag && (
                <p className="text-foreground-muted text-[9px] font-bold uppercase tracking-wider">
                  {p.categoryTag}
                </p>
              )}
            </div>
            
            {p.productCode && (
              <button 
                onClick={handleCopyCode}
                className={cn(
                  "transition-all flex items-center justify-center size-6 rounded-md hover:bg-surface-hover shrink-0",
                  copied ? "text-primary" : "text-foreground-muted hover:text-primary"
                )}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
            )}
          </div>

          {p.description && (
            <p className="text-[11px] text-foreground-secondary line-clamp-2 leading-relaxed h-[2.8em]">
              {p.description}
            </p>
          )}
        </div>

        {/* Pricing Section */}
        <div className="pt-2 border-t border-border-light">
          <div className="flex items-baseline justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] text-foreground-muted font-bold uppercase tracking-widest">Retail</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">{formatKobo(retailPrice)}</span>
                {p.unit && <span className="text-foreground-muted text-[10px] font-bold">/ {p.unit}</span>}
              </div>
            </div>
            {wholesalePrice && isOwner && (
              <div className="flex flex-col items-end text-right">
                <span className="text-[9px] text-primary font-bold uppercase tracking-widest">Wholesale</span>
                <span className="text-sm font-bold text-primary">
                  {formatKobo(wholesalePrice)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* Action Bar */}
        <div className="flex gap-2 pt-2">
          {isOwner ? (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/merchant/products/${p.id}/edit`);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-foreground text-foreground-inverse font-bold text-[10px] uppercase tracking-widest py-2.5 rounded-lg transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(detailUrl);
                }}
                className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground-secondary font-bold text-[10px] uppercase tracking-widest py-2.5 rounded-lg transition-all hover:bg-surface-hover active:scale-[0.98]"
              >
                Details
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onQuickBuy) onQuickBuy(p);
                  else router.push(`/buyer/products/${p.id}`);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-[10px] uppercase tracking-widest py-2.5 rounded-lg transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                Buy Now
              </button>
              
              <button 
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="size-9 shrink-0 flex items-center justify-center bg-background-secondary text-foreground-secondary hover:bg-surface-hover rounded-lg transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">
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
                    "size-9 shrink-0 flex items-center justify-center rounded-lg transition-all active:scale-95 border",
                    isSaved 
                      ? "bg-red-50 text-red-500 border-red-100 shadow-sm" 
                      : "bg-surface text-foreground-muted border-border hover:bg-surface-hover"
                  )}
                >
                  <span 
                    className="material-symbols-outlined text-[18px]" 
                    style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    bookmark
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
