"use client";

import { useEffect, useState } from "react";
import { productApi } from "@/lib/api/product.api";
import { ProductCard } from "@/components/shared/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { useAuth } from "@/providers/auth-provider";
import Link from "next/link";

export default function SocialFeedPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, [page]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const response = await productApi.getSocialFeed(page, 12);
      
      if (page === 1) {
        setProducts(response.data);
      } else {
        setProducts(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === 12);
    } catch (error) {
      console.error("Error fetching social feed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
            Discover
          </h1>
          <p className="text-slate-500">
            Latest products from your starred merchants.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 -mx-4 sm:mx-0">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-full rounded-none sm:rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
            Discover
          </h1>
          <p className="text-slate-500">
            Stay updated with products from your starred merchants.
          </p>
        </div>
        
        <Link 
          href="/buyer/catalogue"
          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
        >
          View all products
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </header>

      {products.length === 0 ? (
        <EmptyState
          icon="explore"
          message="Your feed is empty"
          description="Star merchants to see their latest products here. Start exploring our catalogue to find merchants you love."
          actionLabel="Explore Catalogue"
          onAction={() => window.location.href = "/buyer/catalogue"}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 sm:gap-6 -mx-4 sm:mx-0 divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                isOwner={false}
                onQuickBuy={(p) => {
                  window.location.href = `/buyer/products/${p.id}`;
                }}
                className="rounded-none sm:rounded-xl"
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-8">
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
                className="px-6 py-2 rounded-full border border-slate-200 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
