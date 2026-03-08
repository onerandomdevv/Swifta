"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { getCatalogue } from "@/lib/api/product.api";
import { getCategories } from "@/lib/api/category.api";
import { type Product, type Category } from "@hardware-os/shared";

import { CatalogueGrid } from "@/components/buyer/catalogue/catalogue-grid";
import { CatalogueSkeleton } from "@/components/buyer/catalogue/catalogue-skeleton";
import { CategoryCard } from "@/components/buyer/catalogue/category-card";

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
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#0f1115] animate-in fade-in duration-700">
      {/* Search Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-6 shrink-0 shadow-sm z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Industrial Catalogue
            </h1>
            <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
              Verified Wholesale Supply
            </p>
          </div>

          <div className="relative flex-1 max-w-xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -track-y-1/2 -translate-y-1/2 text-slate-400 text-xl">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-sm font-medium outline-none transition-all shadow-inner"
              placeholder="Search by product, category, or manufacturer..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Last Updated
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Today,{" "}
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8 space-y-8 pb-32">
          {/* Category Cards Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Browse Categories
              </h2>
              {activeCategory !== "All Categories" && (
                <button
                  onClick={() => setActiveCategory("All Categories")}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  Clear Filter
                </button>
              )}
            </div>

            {/* Horizontal Scroll on Mobile, Grid on Desktop */}
            <div className="flex md:grid md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
              <CategoryCard
                category={
                  {
                    id: "all",
                    name: "All Products",
                    slug: "All Categories",
                    icon: "grid_view",
                  } as any
                }
                isSelected={activeCategory === "All Categories"}
                onClick={() => setActiveCategory("All Categories")}
              />
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat as any}
                  isSelected={
                    activeCategory === cat.slug ||
                    (Array.isArray(cat.children) &&
                      cat.children.some((c) => c.slug === activeCategory))
                  }
                  onClick={() => setActiveCategory(cat.slug)}
                />
              ))}
            </div>

            {/* Subcategory Chips */}
            {categories.find(
              (c) =>
                c.slug === activeCategory ||
                c.children?.some((sc) => sc.slug === activeCategory),
            ) && (
              <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {categories
                  .find(
                    (c) =>
                      c.slug === activeCategory ||
                      c.children?.some((sc) => sc.slug === activeCategory),
                  )
                  ?.children?.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveCategory(sub.slug)}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeCategory === sub.slug
                          ? "bg-slate-900 text-white shadow-md"
                          : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
              </div>
            )}
          </section>

          {/* Result Info & Toolbar */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">
                analytics
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {products.length}{" "}
                <span className="text-slate-500 font-medium">
                  products found
                </span>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-4 w-[1px] bg-slate-100 dark:bg-slate-800" />
              <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">sort</span>
                Popular
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <section>
            <CatalogueGrid
              products={products}
              setSearchQuery={setSearchQuery}
              setActiveCategory={setActiveCategory}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
