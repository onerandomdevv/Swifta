"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getWishlist, toggleWishlist } from "@/lib/api/wishlist.api";
import { type Product } from "@swifta/shared";
import { ProductCard } from "@/components/shared/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BuyerSavedPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"products" | "merchants">("products");
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
    const originalProducts = [...products];
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    try {
      await toggleWishlist(productId);
      toast.success("Item removed from saved");
    } catch {
      setProducts(originalProducts);
      toast.error("Failed to update status");
    }
  }

  const handleClearAll = () => {
    toast.info("Clearing your collection...");
    setProducts([]);
    // In a real app, you'd call an API here
  };

  const handleAddAllToCart = () => {
    toast.success("Adding all items to cart...");
    // Logic for bulk add to cart
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="flex gap-8 border-b border-slate-200">
          <Skeleton className="h-10 w-24 rounded-t-xl" />
          <Skeleton className="h-10 w-24 rounded-t-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8 font-display animate-in fade-in duration-700">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Saved Items</h2>
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-8">
          <button 
            onClick={() => setActiveTab("products")}
            className={cn(
              "flex items-center gap-2 border-b-2 pb-4 px-1 transition-all duration-300 relative",
              activeTab === "products" 
                ? "border-primary text-primary" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <span className="text-sm font-bold">Products ({products.length})</span>
          </button>
          <button 
            onClick={() => setActiveTab("merchants")}
            className={cn(
              "flex items-center gap-2 border-b-2 pb-4 px-1 transition-all duration-300",
              activeTab === "merchants" 
                ? "border-primary text-primary" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <span className="text-sm font-bold">Merchants (0)</span>
          </button>
        </div>
      </header>

      {products.length > 0 && activeTab === "products" && (
        <div className="flex flex-wrap justify-end items-center gap-4 mb-8">
          <button 
            onClick={handleClearAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">delete_sweep</span>
            Clear All
          </button>
          <button 
            onClick={handleAddAllToCart}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-emerald-600 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
            Add All Active to Cart
          </button>
        </div>
      )}

      {/* Main Content */}
      {activeTab === "products" ? (
        products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 animate-in zoom-in duration-500">
            <div className="bg-white p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col items-center text-center max-w-md border border-slate-50">
              <div className="w-48 h-48 mb-8 bg-primary/5 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-7xl text-primary/40">inventory_2</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Your collection is empty</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Browse the catalogue to save items for later or to order items in bulk.
              </p>
              <Link 
                href="/buyer/catalogue"
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center gap-2"
              >
                <span className="material-symbols-outlined">explore</span>
                Explore Catalogue
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickBuy={() => router.push(`/buyer/checkout/${product.id}`)}
                isSaved={true}
                onToggleSave={handleToggleSave}
                isOwner={false}
              />
            ))}
          </div>
        )
      ) : (
        /* Merchants Tab Placeholder */
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
           <span className="material-symbols-outlined text-6xl mb-4">storefront</span>
           <p className="font-bold">No saved merchants yet</p>
        </div>
      )}
    </div>
  );
}
