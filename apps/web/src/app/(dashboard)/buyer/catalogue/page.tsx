"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getCatalogue } from "@/lib/api/product.api";
import type { Product } from "@hardware-os/shared";

// Extracted Components
import { CatalogueGrid } from "@/components/buyer/catalogue/catalogue-grid";
import { CatalogueSkeleton } from "@/components/buyer/catalogue/catalogue-skeleton";

export default function BuyerCataloguePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);

  const categories = [
    "All",
    "Building Materials",
    "Electrical",
    "Plumbing",
    "Tools",
    "Safety",
  ];

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
          p.categoryTag?.toLowerCase().includes(activeCategory.toLowerCase()),
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
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header (Stitch V1 Aesthetic) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">
            grid_view
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Private Catalogue
          </h1>
        </div>

        <div className="w-full md:w-[400px]">
          <label className="flex flex-col w-full">
            <div className="flex w-full items-stretch rounded-lg h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <div className="text-slate-400 flex items-center justify-center pl-4">
                <span className="material-symbols-outlined font-normal">
                  search
                </span>
              </div>
              <input
                type="text"
                placeholder="Search materials (e.g. Cement, Rods)"
                className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 px-3 text-sm font-normal outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="flex items-center pr-3">
                <span className="material-symbols-outlined text-slate-400 text-xl">
                  tune
                </span>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Category Pills (Stitch V1 Aesthetic) */}
      <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex h-9 shrink-0 items-center justify-center px-4 rounded-full text-xs transition-all active:scale-95 ${
              activeCategory === cat
                ? "bg-primary text-white font-semibold shadow-sm"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <CatalogueGrid
        products={filteredProducts}
        setSearchQuery={setSearchQuery}
        setActiveCategory={setActiveCategory}
      />
    </div>
  );
}
