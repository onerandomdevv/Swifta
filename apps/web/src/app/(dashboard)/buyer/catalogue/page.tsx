"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { productApi } from "@/lib/api/product.api";
import { getCategories } from "@/lib/api/category.api";
import { merchantApi } from "@/lib/api/merchant.api";
import { getSavedProductIds, toggleWishlist } from "@/lib/api/wishlist.api";
import {
  type Product,
  type Category,
  type MerchantProfile,
  type PaginatedResponse,
} from "@swifta/shared";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";

import { ExploreSearchBar } from "@/components/buyer/catalogue/explore-search-bar";
import { CategoryStoriesBar } from "@/components/buyer/catalogue/category-stories-bar";
import { MerchantSpotlightCarousel } from "@/components/buyer/catalogue/merchant-spotlight-carousel";
import { ProductCard } from "@/components/shared/product-card";
import { ExploreSkeleton } from "@/components/buyer/catalogue/explore-skeleton";
import { InstantCheckoutModal } from "@/components/buyer/checkout/instant-checkout-modal";
import { cn } from "@/lib/utils";

export default function BuyerCataloguePage() {
  const { user } = useAuth();
  const router = useRouter();

  // ─── State ───
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<MerchantProfile[]>([]);
  const [merchantsLoading, setMerchantsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "rating">("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // ─── Infinite Query ───
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: productsLoading,
    isError,
    error: queryError,
    refetch
  } = useInfiniteQuery<PaginatedResponse<Product>, Error>({
    queryKey: ["catalogue", searchQuery, activeCategory],
    queryFn: ({ pageParam = 1 }) => productApi.getCatalogue(searchQuery, activeCategory, pageParam as number, 20),
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.meta.total / lastPage.meta.limit);
      return lastPage.meta.page < totalPages ? lastPage.meta.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Flatten products
  const products = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

  // ─── Infinite Scroll Observer ───
  const observerTarget = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "300px" }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ─── Load Initial Data ───
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

  // ─── Client-side sort ───
  const sortedProducts = useMemo(() => {
    const copy = [...products];
    switch (sortBy) {
      case "newest":
        return copy.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case "price_asc":
        return copy.sort((a, b) => Number(a.wholesalePriceKobo || a.retailPriceKobo || 0) - Number(b.wholesalePriceKobo || b.retailPriceKobo || 0));
      case "price_desc":
        return copy.sort((a, b) => Number(b.wholesalePriceKobo || b.retailPriceKobo || 0) - Number(a.wholesalePriceKobo || a.retailPriceKobo || 0));
      case "rating":
        return copy.sort((a, b) => (b.merchantProfile?.averageRating || 0) - (a.merchantProfile?.averageRating || 0));
      default:
        return copy;
    }
  }, [products, sortBy]);

  // ─── Handlers ───
  function handleQuickBuy(product: Product) {
    setCheckoutProduct(product);
  }

  async function handleToggleSave(productId: string) {
    const wasSaved = savedIds.has(productId);
    const isNowSaved = !wasSaved;

    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      await toggleWishlist(productId);
      const { toast } = await import("sonner");
      toast.success(isNowSaved ? "Product saved" : "Product removed");
    } catch (err) {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
      const { toast } = await import("sonner");
      toast.error("Failed to update wishlist");
    }
  }

  // ─── Rendering States ───
  if (productsLoading && products.length === 0) {
    return <ExploreSkeleton />;
  }

  if (isError) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400 mb-4">error</span>
        <p className="text-red-500 font-bold">{(queryError as any)?.message || "Failed to load"}</p>
        <button onClick={() => refetch()} className="mt-4 text-primary text-xs font-black uppercase tracking-widest hover:underline">
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
      <ExploreSearchBar value={searchQuery} onChange={setSearchQuery} />
      
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8 py-6 sm:py-8 space-y-10 sm:space-y-16">
        <CategoryStoriesBar
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />

        <MerchantSpotlightCarousel
          merchants={merchants}
          loading={merchantsLoading}
        />

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
              <span className="material-symbols-outlined text-3xl text-slate-300">search_off</span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">No results found</h4>
              <button onClick={() => { setSearchQuery(""); setActiveCategory("All Categories"); }} className="text-primary font-bold text-xs hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isOwner={false}
                  onQuickBuy={handleQuickBuy}
                  isSaved={savedIds.has(product.id)}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          )}

          {/* Infinite Scroll Anchor */}
          <div ref={observerTarget} className="h-20 flex items-center justify-center">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-slate-400 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                <span className="text-xs font-bold uppercase tracking-widest ml-2">Loading more products...</span>
              </div>
            )}
            {!hasNextPage && sortedProducts.length > 0 && (
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No more products found</p>
            )}
          </div>
        </section>
      </div>

      {/* Controls Overlay */}
      <div className="fixed bottom-20 lg:bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-1.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800 dark:border-slate-200">
          {sortOptions.slice(0, 3).map((opt) => (
            <button 
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={cn(
                "px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-bold transition-all",
                sortBy === opt.value ? "bg-primary text-white" : "hover:bg-slate-800 dark:hover:bg-slate-100"
              )}
            >
              {opt.label.split(":")[0]}
            </button>
          ))}
          <div className="w-[1px] h-4 bg-slate-700 dark:bg-slate-200 mx-1"></div>
          <button onClick={() => setShowSortMenu(!showSortMenu)} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100">
            <span className="material-symbols-outlined text-lg">tune</span>
          </button>
          
          {showSortMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="flex flex-col">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                    className={cn("text-left px-4 py-3 text-sm font-medium", sortBy === opt.value ? "text-primary bg-slate-50 dark:bg-slate-800" : "text-slate-700 dark:text-slate-300")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
