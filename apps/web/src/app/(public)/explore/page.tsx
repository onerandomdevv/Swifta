"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "@/lib/api/product.api";
import { ProductCard } from "@/components/shared/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { type Product } from "@twizrr/shared";

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const page = Number(searchParams.get("page")) || 1;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", "catalogue", search, category, page],
    queryFn: () => productApi.getCatalogue(search, category, page, 24),
  });

  const products = data?.data || [];
  const totalCount = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 0;

  const clearFilters = () => {
    router.push("/explore");
  };

  return (
    <div className="container px-4 py-8 md:py-12">
      {/* Search Header Info */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
            {search ? `Results for "${search}"` : category && category !== "all" ? `${category.charAt(0).toUpperCase() + category.slice(1)}` : "Explore Products"}
          </h1>
          {!isLoading && (
            <p className="text-sm font-bold text-foreground-muted uppercase tracking-widest">
              {totalCount} {totalCount === 1 ? "Product" : "Products"} found
            </p>
          )}
        </div>
        
        {/* Active Filters */}
        {(search || (category && category !== "all")) && (
          <button
            onClick={clearFilters}
            className="self-start text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          message="Something went wrong"
          description="We couldn't load the products. Please try again later."
          icon="error"
          actionLabel="Retry"
          onAction={() => refetch()}
          className="my-12"
        />
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {products.map((product: Product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              showMerchant={true}
              className="h-full"
            />
          ))}
        </div>
      ) : (
        <div className="my-12 flex flex-col items-center justify-center">
          <EmptyState
            message="No products found"
            description={search ? `We couldn't find any products matching "${search}".` : "There are no products in this category yet."}
            icon="search_off"
            actionLabel={search || category ? "Clear filters" : "Go Home"}
            onAction={clearFilters}
          />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            const isActive = p === page;
            return (
              <button
                key={p}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", p.toString());
                  router.push(`/explore?${params.toString()}`);
                }}
                className={`size-10 rounded-xl text-xs font-black transition-all ${
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                    : "bg-surface text-foreground-muted hover:bg-accent"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
