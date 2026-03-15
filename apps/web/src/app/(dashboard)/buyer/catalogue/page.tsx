"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { productApi } from "@/lib/api/product.api";
import { getCategories } from "@/lib/api/category.api";
import { merchantApi } from "@/lib/api/merchant.api";
import { getSavedProductIds, toggleWishlist } from "@/lib/api/wishlist.api";
import {
  type Product,
  type Category,
  type MerchantProfile,
} from "@hardware-os/shared";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";

import { ExploreSearchBar } from "@/components/buyer/catalogue/explore-search-bar";
import { CategoryStoriesBar } from "@/components/buyer/catalogue/category-stories-bar";
import { MerchantSpotlightCarousel } from "@/components/buyer/catalogue/merchant-spotlight-carousel";
import { ProductFeedCard } from "@/components/buyer/catalogue/product-feed-card";
import { ExploreSkeleton } from "@/components/buyer/catalogue/explore-skeleton";
import { InstantCheckoutModal } from "@/components/buyer/checkout/instant-checkout-modal";
import { cn } from "@/lib/utils";

export default function BuyerCataloguePage() {
  const { user } = useAuth();
  const router = useRouter();

  // ─── State ───
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [merchants, setMerchants] = useState<MerchantProfile[]>([]);
  const [merchantsLoading, setMerchantsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "rating">("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);



  // Wishlist state
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const isInitialMount = useRef(true);

  // ─── Load Categories & Merchants (once) ───
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [cats, mercs, savedList] = await Promise.all([
          getCategories(),
          merchantApi.getMerchants(),
          getSavedProductIds().catch(() => [] as string[]),
        ]);
        setCategories(cats);
        setMerchants(mercs);
        setSavedIds(new Set(savedList));
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setMerchantsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // ─── Fetch Products (debounced) ───
  const fetchProducts = useCallback(
    async (search: string, category: string) => {
      try {
        setError("");
        setLoading(true);
        const response = await productApi.getCatalogue(search, category, 1, 50);
        setProducts(response);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load catalogue",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Trigger initial load
      fetchProducts("", "All Categories");
      return;
    }
    const timer = setTimeout(() => {
      fetchProducts(searchQuery, activeCategory);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, activeCategory, fetchProducts]);

  // ─── Client-side sort ───
  const sortedProducts = React.useMemo(() => {
    const copy = [...products];
    switch (sortBy) {
      case "newest":
        return copy.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );
      case "price_asc":
        return copy.sort(
          (a, b) =>
            Number(a.wholesalePriceKobo || a.retailPriceKobo || 0) -
            Number(b.wholesalePriceKobo || b.retailPriceKobo || 0),
        );
      case "price_desc":
        return copy.sort(
          (a, b) =>
            Number(b.wholesalePriceKobo || b.retailPriceKobo || 0) -
            Number(a.wholesalePriceKobo || a.retailPriceKobo || 0),
        );
      case "rating":
        return copy.sort(
          (a, b) =>
            (b.merchantProfile?.averageRating || 0) -
            (a.merchantProfile?.averageRating || 0),
        );
      default:
        return copy;
    }
  }, [products, sortBy]);

  // ─── Quick Buy handler ───
  function handleQuickBuy(product: Product) {
    setCheckoutProduct(product);
  }

  // ─── Wishlist toggle handler ───
  async function handleToggleSave(productId: string) {
    const wasSaved = savedIds.has(productId);
    const isNowSaved = !wasSaved;

    // Optimistic update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
    try {
      await toggleWishlist(productId);
      const { toast } = await import("sonner");
      toast.success(isNowSaved ? "Product saved to wishlist" : "Product removed from wishlist");
    } catch (err) {
      // Revert on failure
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });
      const { toast } = await import("sonner");
      toast.error("Failed to update saved list");
    }
  }

  // ─── Loading State ───
  if (loading && products.length === 0) {
    return (
      <div className="space-y-6">
        <ExploreSkeleton />
      </div>
    );
  }

  // ─── Error State ───
  if (error) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400 mb-4">
          error
        </span>
        <p className="text-red-500 font-bold">{error}</p>
        <button
          onClick={() => fetchProducts("", "All Categories")}
          className="mt-4 text-primary text-xs font-black uppercase tracking-widest hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const sortOptions = [
    { value: "newest" as const, label: "Newest", icon: "schedule" },
    { value: "price_asc" as const, label: "Price: Low → High", icon: "trending_up" },
    { value: "price_desc" as const, label: "Price: High → Low", icon: "trending_down" },
    { value: "rating" as const, label: "Top Rated", icon: "star" },
  ];

  return (
    <div className="animate-in fade-in duration-300 min-h-screen font-display bg-white dark:bg-slate-900">
      {/* ─── Discovery Header ─── */}
      <ExploreSearchBar value={searchQuery} onChange={setSearchQuery} />
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 space-y-16">
        {/* Category Stories */}
        <CategoryStoriesBar
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />

        {/* ─── Merchant Spotlight ─── */}
        <MerchantSpotlightCarousel
          merchants={merchants}
          loading={merchantsLoading}
        />

        {/* ─── The Feed ─── */}
        <section className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              Product Discovery
              <span className="text-slate-300 text-sm font-medium">/ Discover Everything</span>
            </h2>
            <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
              {sortedProducts.length} Items Found
            </div>
          </div>

          {sortedProducts.length === 0 ? (
            <div className="py-32 text-center space-y-4">
              <div className="size-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto opacity-50">
                <span className="material-symbols-outlined text-3xl text-slate-300">
                  search_off
                </span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  No results found
                </h4>
                <p className="text-slate-400 text-xs mt-1">
                  Try adjusting your search or filters.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All Categories");
                }}
                className="text-primary font-bold text-xs hover:underline mt-4"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedProducts.map((product) => (
                <ProductFeedCard
                  key={product.id}
                  product={product}
                  onQuickBuy={handleQuickBuy}
                  isSaved={savedIds.has(product.id)}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ─── Sticky Bottom Controls ─── */}
      <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-1.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1 border border-slate-800 dark:border-slate-200">
          {sortOptions.slice(0, 3).map((opt) => (
            <button 
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={cn(
                "px-5 py-2 rounded-lg text-xs font-bold transition-all",
                sortBy === opt.value 
                  ? "bg-primary text-white" 
                  : "hover:bg-slate-800 dark:hover:bg-slate-100"
              )}
            >
              {opt.label.split(":")[0]}
            </button>
          ))}
          <div className="w-[1px] h-4 bg-slate-700 dark:bg-slate-200 mx-1"></div>
          <button 
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">tune</span>
          </button>
        </div>
      </div>
      {/* ─── Instant Checkout Modal ─── */}
      {checkoutProduct && (
        <InstantCheckoutModal
          isOpen={!!checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
          product={checkoutProduct}
          merchant={checkoutProduct.merchantProfile}
        />
      )}
    </div>
  );
}
