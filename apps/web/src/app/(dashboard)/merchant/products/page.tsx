"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { productApi } from "@/lib/api/product.api";
import { useToast } from "@/providers/toast-provider";
import { useMerchantInventory } from "@/hooks/use-merchant-data";
import { type Product } from "@hardware-os/shared";

// Extracted Components
import { MerchantProductsGrid } from "@/components/merchant/products/merchant-products-grid";
import { MerchantInventoryTable } from "@/components/merchant/products/merchant-inventory-table";
import { ProductCreationDrawer } from "@/components/merchant/products/product-creation-drawer";

export default function MerchantProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isCreationDrawerOpen, setIsCreationDrawerOpen] = useState(false);
  const [repostProduct, setRepostProduct] = useState<Product | null>(null);

  // Auto-open drawer if action=list is present
  React.useEffect(() => {
    if (searchParams.get("action") === "list") {
      setIsCreationDrawerOpen(true);
      // Clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
    }
  }, [searchParams]);

  const { products, isLoading, isError, error, refetch } =
    useMerchantInventory();

  const handleDelist = async (productId: string) => {
    try {
      await productApi.deleteProduct(productId);
      refetch();
      if (repostProduct?.id === productId) setRepostProduct(null);
      toast.success("Product deleted successfully");
    } catch (err: any) {
      toast.error(err?.error || err?.message || "Failed to delete product");
    }
  };

  const handleRepost = (product: Product) => {
    setRepostProduct(product);
    setIsCreationDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-full rounded-[3rem]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center space-y-8 max-w-[1200px] mx-auto">
        <div className="size-24 rounded-full bg-red-50 flex items-center justify-center border-4 border-white shadow-xl">
          <span className="material-symbols-outlined text-5xl text-red-500">error</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-navy-dark tracking-tight uppercase">Registry Access Failed</h2>
          <p className="text-slate-500 max-w-sm mx-auto font-medium">{error}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-10 py-4 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-navy-dark/20 transition-all hover:scale-105 active:scale-95"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Calculate high-impact stats
  const totalSkus = products.length;
  const lowStock = products.filter((p) => {
    const stock = p.stockCache?.stock || 0;
    const threshold = p.minOrderQuantity > 0 ? p.minOrderQuantity * 2 : 10;
    return p.isActive && stock > 0 && stock <= threshold;
  }).length;
  const activeListings = products.filter((p) => p.isActive).length;

  return (
    <div className="max-w-[1400px] mx-auto w-full p-4 md:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 dark:border-slate-800 pb-10">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5">Asset Inventory</p>
          <h1 className="text-4xl lg:text-5xl font-black text-navy-dark dark:text-white tracking-tighter uppercase font-display leading-none">
            Materials Registry
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide">
            Manage your industrial catalog, market pricing, and warehouse logistics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center shrink-0 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${viewMode === "grid" ? "bg-white dark:bg-slate-700 text-navy-dark dark:text-white shadow-sm font-black" : "text-slate-400 hover:text-slate-600 font-bold"}`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
              <span className="text-[10px] uppercase tracking-widest hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${viewMode === "table" ? "bg-white dark:bg-slate-700 text-navy-dark dark:text-white shadow-sm font-black" : "text-slate-400 hover:text-slate-600 font-bold"}`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[18px]">table_chart</span>
              <span className="text-[10px] uppercase tracking-widest hidden sm:inline">Inventory</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreationDrawerOpen(true)}
            className="group flex items-center gap-3 px-10 py-5 bg-navy-dark text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-navy-dark/30 hover:bg-navy-light transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform duration-700">add_circle</span>
            List New Material
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Active SKUs", value: activeListings, icon: "inventory_2", color: "bg-blue-50 text-blue-600 border-blue-100" },
          { label: "Market Visibility", value: `${Math.round((activeListings/totalSkus || 0) * 100)}%`, icon: "visibility", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
          { label: "Low Stock Alert", value: lowStock, icon: "warning", color: "bg-amber-50 text-amber-600 border-amber-100" },
          { label: "Catalog Depth", value: totalSkus, icon: "analytics", color: "bg-primary/10 text-primary border-primary/20" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm flex items-center gap-6 hover:translate-y-[-4px] transition-all">
            <div className={`size-14 rounded-2xl flex items-center justify-center border ${stat.color}`}>
              <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-3xl font-black text-navy-dark dark:text-white tabular-nums tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content Section */}
      <div className="animate-in fade-in duration-1000 delay-300">
        {viewMode === "grid" ? (
          <MerchantProductsGrid 
            products={products} 
            onDelist={handleDelist} 
            onRepost={handleRepost}
            onAddClick={() => {
              setRepostProduct(null);
              setIsCreationDrawerOpen(true);
            }}
          />
        ) : (
          <MerchantInventoryTable
            products={products}
            onRepost={handleRepost}
          />
        )}
      </div>

      <ProductCreationDrawer 
        isOpen={isCreationDrawerOpen}
        initialData={repostProduct || undefined}
        onClose={() => {
          setIsCreationDrawerOpen(false);
          setRepostProduct(null);
        }}
        onSuccess={() => {
          setIsCreationDrawerOpen(false);
          setRepostProduct(null);
          refetch();
        }}
      />
    </div>
  );
}
