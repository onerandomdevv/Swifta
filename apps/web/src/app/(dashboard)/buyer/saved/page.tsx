"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getWishlist, toggleWishlist } from "@/lib/api/wishlist.api";
import { type Product } from "@hardware-os/shared";
import { ProductFeedCard } from "@/components/buyer/catalogue/product-feed-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BuyerSavedPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchSaved() {
      try {
        const data = await getWishlist();
        setProducts(data);
      } catch (err) {
        console.error("Failed to load saved products", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSaved();
  }, []);

  async function handleToggleSave(productId: string) {
    // Optimistic: remove from list immediately
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    try {
      await toggleWishlist(productId);
    } catch {
      // Re-fetch on failure
      const data = await getWishlist();
      setProducts(data);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <Skeleton className="h-10 w-56 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* ─── Header ─── */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            favorite
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
            Saved Products
          </h1>
        </div>
        <p className="text-slate-500 font-bold text-sm tracking-wide uppercase ml-[42px]">
          {products.length} {products.length === 1 ? "product" : "products"} saved
        </p>
      </div>

      {/* ─── Empty State ─── */}
      {products.length === 0 ? (
        <div className="py-20 text-center space-y-6 animate-in zoom-in duration-500">
          <div className="size-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-5xl text-slate-300">
              favorite_border
            </span>
          </div>
          <div>
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              No saved products yet
            </h4>
            <p className="text-slate-500 font-medium text-sm mt-2 max-w-sm mx-auto">
              Browse the catalogue and tap the heart icon to save products you love.
            </p>
          </div>
          <Link
            href="/buyer/catalogue"
            className="inline-flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.15em] hover:underline decoration-2 underline-offset-8"
          >
            <span className="material-symbols-outlined text-sm">explore</span>
            Explore Catalogue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {products.map((product) => (
            <ProductFeedCard
              key={product.id}
              product={product}
              onQuickBuy={() => router.push(`/buyer/checkout/${product.id}`)}
              isSaved={true}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      )}

    </div>
  );
}
