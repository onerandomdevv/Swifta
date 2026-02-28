"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getCatalogue } from "@/lib/api/product.api";
import type { Product } from "@hardware-os/shared";

import { CatalogueGrid } from "@/components/buyer/catalogue/catalogue-grid";
import { CatalogueSkeleton } from "@/components/buyer/catalogue/catalogue-skeleton";

const CATEGORIES = [
  { label: "All Materials", tag: "All" },
  { label: "Building Materials", tag: "BUILDING_MATERIALS" },
  { label: "Metal & Steel", tag: "METAL_STEEL" },
  { label: "Plumbing", tag: "PLUMBING" },
  { label: "Electrical", tag: "ELECTRICAL" },
  { label: "Power Tools", tag: "POWER_TOOLS" },
  { label: "Safety Gear", tag: "SAFETY_GEAR" },
  { label: "Heavy Machinery", tag: "HEAVY_MACHINERY" },
  { label: "Painting", tag: "PAINTING" },
];

export default function BuyerCataloguePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = useCallback(async (search: string) => {
    try {
      setLoading(true);
      const response = await getCatalogue(search, 1, 50);
      setProducts(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load catalogue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts("");
  }, [fetchProducts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchProducts]);

  const filteredProducts =
    activeCategory === "All"
      ? products
      : products.filter((p) =>
          p.categoryTag?.toUpperCase().includes(activeCategory.toUpperCase()),
        );

  if (loading && products.length === 0) {
    return <CatalogueSkeleton />;
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400 mb-4">
          error
        </span>
        <p className="text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface-light dark:bg-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-8 py-4 justify-between shrink-0">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
            Lagos Wholesale Hub
          </h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-primary -mt-1 uppercase">
            Industrial Procurement
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-0 text-sm outline-none transition-all text-slate-900 dark:text-white"
              placeholder="Search industrial catalog..."
            />
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex px-8 shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.tag}
            onClick={() => setActiveCategory(cat.tag)}
            className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeCategory === cat.tag
                ? "text-primary border-primary"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 border-transparent"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-3 flex gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Filters:
          </span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-slate-400 transition-colors text-slate-700 dark:text-slate-300">
            Availability{" "}
            <span className="material-symbols-outlined text-sm">
              expand_more
            </span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-slate-400 transition-colors text-slate-700 dark:text-slate-300">
            Min. Order Quantity{" "}
            <span className="material-symbols-outlined text-sm">
              expand_more
            </span>
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
            Viewing {filteredProducts.length} of {products.length} items
          </span>
        </div>
      </div>

      {/* Product Grid */}
      <main className="flex-1 overflow-y-auto p-8">
        <CatalogueGrid
          products={filteredProducts}
          setSearchQuery={setSearchQuery}
          setActiveCategory={setActiveCategory}
        />
      </main>
    </div>
  );
}
