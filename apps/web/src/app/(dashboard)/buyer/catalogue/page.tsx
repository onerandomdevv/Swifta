"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { getCatalogue } from "@/lib/api/product.api";
import { getCategories } from "@/lib/api/category.api";
import { type Product, type Category } from "@hardware-os/shared";

import { CatalogueGrid } from "@/components/buyer/catalogue/catalogue-grid";
import { CatalogueSkeleton } from "@/components/buyer/catalogue/catalogue-skeleton";

export default function BuyerCataloguePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const isInitialMount = useRef(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }
    loadCategories();
  }, []);

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

  // Debounced search will handle the initial fetch since searchQuery defaults to ""
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchProducts(searchQuery, activeCategory);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, activeCategory, fetchProducts]);

  // Since filtering happens on the backend now, filteredProducts = products.
  const filteredProducts = products;

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
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center px-4 sm:px-8 py-4 justify-between shrink-0 gap-4">
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
              className="pl-10 pr-4 py-2 w-full sm:w-80 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-0 text-sm outline-none transition-all text-slate-900 dark:text-white"
              placeholder="Search industrial catalog..."
            />
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex px-8 shrink-0 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveCategory("All Categories")}
          className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeCategory === "All Categories"
              ? "text-primary border-primary"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 border-transparent"
          }`}
        >
          All Categories
        </button>
        {categories.map((cat: Category) => (
          <div key={cat.id} className="relative group">
            <button
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeCategory === cat.slug ||
                cat.children?.some((c) => c.slug === activeCategory)
                  ? "text-primary border-primary"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 border-transparent"
              }`}
            >
              {cat.name}
            </button>
            {cat.children && cat.children.length > 0 && (
              <div className="absolute left-0 top-full hidden group-hover:block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-50 min-w-[200px]">
                {cat.children.map((sub: Category) => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveCategory(sub.slug)}
                    className={`block w-full text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      activeCategory === sub.slug
                        ? "text-primary"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 flex flex-wrap gap-4 shrink-0">
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
