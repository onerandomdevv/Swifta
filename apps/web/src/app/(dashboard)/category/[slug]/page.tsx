"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { getCatalogue } from "@/lib/api/product.api";
import { getCategoryBySlug } from "@/lib/api/category.api";
import { type Product, type Category } from "@hardware-os/shared";

import { CatalogueGrid } from "@/components/buyer/catalogue/catalogue-grid";
import { CatalogueSkeleton } from "@/components/buyer/catalogue/catalogue-skeleton";
import { useAuth } from "@/providers/auth-provider";

export default function CategoryLandingPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    async function loadCategory() {
      if (!slug) return;
      try {
        const data = await getCategoryBySlug(slug as string);
        setCategory(data);
      } catch (err) {
        console.error("Failed to load category", err);
        setError("Category not found");
      }
    }
    loadCategory();
  }, [slug]);

  const fetchProducts = useCallback(async () => {
    if (!category) return;
    try {
      setLoading(true);
      // Basic implementation: filtering logic on frontend or extended API later
      const data = await getCatalogue("", category.slug, 1, 100);
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter((p) => {
    if (Object.keys(selectedFilters).length === 0) return true;
    return Object.entries(selectedFilters).every(([key, val]) => {
      return p.attributes?.[key] === val;
    });
  });

  if (loading && !category) return <CatalogueSkeleton />;
  if (error)
    return (
      <div className="p-20 text-center text-red-500 font-bold">{error}</div>
    );

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#0f1115]">
      {/* Category Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-10 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
            <span className="material-symbols-outlined text-sm">
              {category?.icon || "grid_view"}
            </span>
            <span>Category</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {category?.name}
          </h1>
          <p className="text-slate-500 mt-2 font-medium max-w-2xl">
            Browse our wide selection of {category?.name?.toLowerCase()}.
            Guaranteed quality with SwiftTrade escrow protection.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          {category?.attributes &&
            (category.attributes as any[]).length > 0 && (
              <aside className="w-full lg:w-64 shrink-0 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                    Filters
                  </h3>

                  {(category.attributes as any[]).map((attr) => (
                    <div key={attr.name} className="space-y-3 mb-6">
                      <label className="text-[10px] font-black uppercase text-slate-900 dark:text-slate-300 tracking-wider">
                        {attr.name}
                      </label>
                      {attr.type === "select" ? (
                        <select
                          className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold outline-none focus:border-primary transition-colors"
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedFilters((prev) => {
                              const next = { ...prev };
                              if (!val) delete next[attr.name];
                              else next[attr.name] = val;
                              return next;
                            });
                          }}
                        >
                          <option value="">All {attr.name}s</option>
                          {attr.options?.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder={`Filter by ${attr.name.toLowerCase()}...`}
                          className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold outline-none focus:border-primary transition-colors"
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedFilters((prev) => {
                              const next = { ...prev };
                              if (!val) delete next[attr.name];
                              else next[attr.name] = val;
                              return next;
                            });
                          }}
                        />
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => setSelectedFilters({})}
                    className="w-full py-3 text-[10px] font-black uppercase text-primary border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </aside>
            )}

          {/* Product Grid Area */}
          <main className="flex-1 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {filteredProducts.length} Products Found
              </p>
            </div>

            {loading ? (
              <CatalogueSkeleton />
            ) : (
              <CatalogueGrid
                products={filteredProducts}
                setSearchQuery={() => {}}
                setActiveCategory={() => {}}
                buyerType={user?.buyerType as any}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
