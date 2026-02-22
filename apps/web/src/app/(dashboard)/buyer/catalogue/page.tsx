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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
            Product Catalogue
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
            Enterprise B2B Marketplace • Lagos Supply Hub
          </p>
        </div>

        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400 group-focus-within:text-accent-orange transition-colors">
              search
            </span>
          </div>
          <input
            type="text"
            placeholder="Search materials..."
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-accent-orange transition-all font-bold text-sm shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
              activeCategory === cat
                ? "bg-navy-dark text-white shadow-lg shadow-navy-dark/20"
                : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-slate-300"
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
