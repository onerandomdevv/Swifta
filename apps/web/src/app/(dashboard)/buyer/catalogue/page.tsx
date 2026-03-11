"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { getCatalogue } from "@/lib/api/product.api";
import { getCategories } from "@/lib/api/category.api";
import { getMerchants } from "@/lib/api/merchant.api";
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



  // Wishlist state
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const isInitialMount = useRef(true);

  // ─── Load Categories & Merchants (once) ───
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [cats, mercs, savedList] = await Promise.all([
          getCategories(),
          getMerchants(),
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
        const response = await getCatalogue(search, category, 1, 50);
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
    router.push(`/buyer/checkout/${product.id}`);
  }

  // ─── Wishlist toggle handler ───
  async function handleToggleSave(productId: string) {
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
    <div className="space-y-5 sm:space-y-7 animate-in fade-in duration-700 pb-10">
      {/* ─── Search Bar ─── */}
      <ExploreSearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* ─── Category Stories ─── */}
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

      {/* ─── Result Info Bar ─── */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg sm:text-xl">
            analytics
          </span>
          <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
            {sortedProducts.length}{" "}
            <span className="text-slate-400 font-bold">
              {sortedProducts.length === 1 ? "PRODUCT" : "PRODUCTS"}
            </span>
          </p>
          {searchQuery && (
            <span className="text-[10px] text-slate-400 font-medium">
              for &quot;{searchQuery}&quot;
            </span>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-primary transition-colors px-2 py-1"
          >
            <span className="material-symbols-outlined text-sm">sort</span>
            <span className="hidden sm:inline">
              {sortOptions.find((s) => s.value === sortBy)?.label || "Sort"}
            </span>
            <span className="material-symbols-outlined text-xs">
              expand_more
            </span>
          </button>

          {showSortMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowSortMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setShowSortMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center gap-2 transition-colors ${
                      sortBy === opt.value
                        ? "text-primary bg-primary/5"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {opt.icon}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Product Feed Grid ─── */}
      {sortedProducts.length === 0 ? (
        <div className="py-20 text-center space-y-6 animate-in zoom-in duration-500">
          <div className="size-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto grayscale opacity-50">
            <span className="material-symbols-outlined text-5xl text-slate-300">
              search_off
            </span>
          </div>
          <div>
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              No products found
            </h4>
            <p className="text-slate-500 font-medium text-sm mt-2">
              Try a different search term or browse another category.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("All Categories");
            }}
            className="text-primary font-black text-xs uppercase tracking-[0.15em] hover:underline decoration-2 underline-offset-8"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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

    </div>
  );
}
