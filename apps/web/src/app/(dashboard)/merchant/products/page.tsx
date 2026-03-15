"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { productApi } from "@/lib/api/product.api";
import { useToast } from "@/providers/toast-provider";
import { useMerchantInventory } from "@/hooks/use-merchant-data";
import { type Product } from "@hardware-os/shared";
import { ProductModal } from "@/components/merchant/products/product-modal";
import { DeleteConfirmationModal } from "@/components/merchant/products/delete-confirmation-modal";
import { toast } from "sonner";

function formatPrice(kobo: string | number | undefined): string {
  if (!kobo) return "Price Not Available";
  const val = Number(kobo) / 100;
  return val.toLocaleString("en-NG", { style: "currency", currency: "NGN" });
}

function getStockInfo(product: Product) {
  const stock = product.stockCache?.stock || 0;
  const threshold = product.minOrderQuantity > 0 ? product.minOrderQuantity * 2 : 10;
  if (stock === 0) return { label: "Out of Stock", color: "text-rose-600", barColor: "bg-rose-500", barWidth: "0%", badgeColor: "bg-rose-500" };
  if (stock <= threshold) return { label: "Critical", color: "text-amber-600", barColor: "bg-amber-500", barWidth: `${Math.min((stock / (threshold * 5)) * 100, 20)}%`, badgeColor: "bg-amber-500" };
  return { label: "Healthy", color: "text-emerald-600", barColor: "bg-emerald-500", barWidth: `${Math.min((stock / 300) * 100, 95)}%`, badgeColor: "bg-emerald-500" };
}

export default function MerchantProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastCtx = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isCreationDrawerOpen, setIsCreationDrawerOpen] = useState(false);
  const [repostProduct, setRepostProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  // Auto-open drawer if action=list is present
  React.useEffect(() => {
    if (searchParams.get("action") === "list") {
      setIsCreationDrawerOpen(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
    }
  }, [searchParams]);

  const { products, isLoading, isError, error, refetch } = useMerchantInventory();

  const handleDelist = async (productId: string) => {
    try {
      await productApi.deleteProduct(productId);
      refetch();
      if (repostProduct?.id === productId) setRepostProduct(null);
      toastCtx.success("Product deleted successfully");
    } catch (err: any) {
      toastCtx.error(err?.error || err?.message || "Failed to delete product");
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await handleDelist(deletingId);
      setDeletingId(null);
    }
  };

  const handleRepost = (product: Product) => {
    setRepostProduct(product);
    setIsCreationDrawerOpen(true);
  };

  // Compute stats
  const totalSkus = products.length;
  const activeListings = products.filter((p) => p.isActive).length;
  const marketVisibility = totalSkus > 0 ? Math.round((activeListings / totalSkus) * 100) : 0;
  const lowStock = products.filter((p) => {
    const stock = p.stockCache?.stock || 0;
    const threshold = p.minOrderQuantity > 0 ? p.minOrderQuantity * 2 : 10;
    return p.isActive && stock > 0 && stock <= threshold;
  }).length;

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.categoryTag).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryTag?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === "all" || p.categoryTag === categoryFilter;
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "active" && p.isActive) ||
        (statusFilter === "inactive" && !p.isActive);

      const stock = p.stockCache?.stock || 0;
      const threshold = p.minOrderQuantity > 0 ? p.minOrderQuantity * 2 : 10;
      const matchesStock = stockFilter === "all" ||
        (stockFilter === "in-stock" && stock > threshold) ||
        (stockFilter === "low-stock" && stock > 0 && stock <= threshold) ||
        (stockFilter === "out-of-stock" && stock === 0);

      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, statusFilter, stockFilter]);

  if (isLoading) {
    return (
      <div className="h-full bg-background-light dark:bg-background-dark p-8 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading products...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full bg-background-light dark:bg-background-dark p-8 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-red-500">error</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Failed to Load Products</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-1">{error}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm transition-all hover:bg-emerald-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display text-slate-900 dark:text-slate-100">
      <main className="max-w-7xl mx-auto w-full p-4 md:p-8 pb-20">
        {/* Header Section */}
        <header className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">Products & Stock</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">Manage your product catalog, pricing, and inventory levels.</p>
          </div>
          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
                Grid
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <span className="material-symbols-outlined text-lg">list</span>
                Table
              </button>
            </div>
            <button
              onClick={() => {
                setRepostProduct(null);
                setIsCreationDrawerOpen(true);
              }}
              className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md"
            >
              <span className="material-symbols-outlined">add</span>
              Add New Product
            </button>
          </div>
        </header>

        {/* KPI Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">inventory</span>
              </div>
              {activeListings > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                  {activeListings}
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active SKUs</p>
            <p className="text-slate-900 dark:text-white text-3xl font-bold mt-1">{activeListings.toLocaleString()}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">visibility</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                +{marketVisibility}%
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Market Visibility</p>
            <p className="text-slate-900 dark:text-white text-3xl font-bold mt-1">{marketVisibility}%</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">warning</span>
              </div>
              {lowStock > 0 && (
                <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded-full">
                  {lowStock}
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Low Stock Alerts</p>
            <p className="text-slate-900 dark:text-white text-3xl font-bold mt-1">{lowStock}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <span className="material-symbols-outlined text-primary">layers</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                {totalSkus}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Catalog Depth</p>
            <p className="text-slate-900 dark:text-white text-3xl font-bold mt-1">{totalSkus}</p>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary transition-all"
              placeholder="Search products by name or SKU..."
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm px-4 py-2.5 min-w-[140px] focus:ring-primary"
          >
            <option value="all">Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm px-4 py-2.5 min-w-[140px] focus:ring-primary"
          >
            <option value="all">Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm px-4 py-2.5 min-w-[140px] focus:ring-primary"
          >
            <option value="all">Stock Level</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </section>

        {/* Content */}
        {filteredProducts.length > 0 ? (
          viewMode === "grid" ? (
            /* Grid View */
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const stockInfo = getStockInfo(product);
                const stock = product.stockCache?.stock || 0;
                const wholesalePrice = product.wholesaleDiscountPercent && product.retailPriceKobo
                  ? Math.round(Number(product.retailPriceKobo) * (1 - (product.wholesaleDiscountPercent / 100)))
                  : product.wholesalePriceKobo
                    ? Number(product.wholesalePriceKobo)
                    : null;

                return (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden group hover:shadow-xl transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="h-[200px] overflow-hidden relative">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                          <span className="material-symbols-outlined text-6xl text-slate-200">image</span>
                        </div>
                      )}
                      {/* Category Tag */}
                      <span className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {product.categoryTag || "General"}
                      </span>
                      {/* Status Badge */}
                      <div className={`absolute top-3 right-3 ${product.isActive ? stockInfo.badgeColor : "bg-slate-500"} text-white px-2 py-1 rounded-lg text-[10px] font-bold`}>
                        {!product.isActive ? "Inactive" : stockInfo.label === "Healthy" ? "Active" : stockInfo.label}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <div className="mb-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-1 truncate flex-1">{product.name}</h3>
                          {product.productCode && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                navigator.clipboard.writeText(product.productCode);
                                toast.success("Product code copied!");
                              }}
                              className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center shrink-0"
                              title="Copy Product Code"
                            >
                              <span className="material-symbols-outlined text-base">content_copy</span>
                            </button>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-xs font-medium uppercase">
                            SKU: {product.productCode || product.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="text-slate-500 text-xs font-medium">
                            {product.minOrderQuantity > 1 ? `Min Order: ${product.minOrderQuantity} ${product.unit?.toLowerCase() || "pcs"}` : `Unit: 1 ${product.unit?.toLowerCase() || "pc"}`}
                          </span>
                        </div>
                      </div>

                      {/* Dual Pricing */}
                      <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Retail Price</p>
                          <p className="text-slate-900 dark:text-white font-bold">
                            {formatPrice(product.retailPriceKobo || product.pricePerUnitKobo)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Wholesale</p>
                          <p className="text-primary font-bold">
                            {wholesalePrice ? formatPrice(wholesalePrice) : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Stock Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-semibold text-slate-500">Stock Level: {stock.toLocaleString()} units</span>
                          <span className={`text-xs font-bold ${stockInfo.color}`}>{stockInfo.label}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div className={`${stockInfo.barColor} h-full transition-all`} style={{ width: stockInfo.barWidth }}></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRepost(product)}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span> Edit
                        </button>
                        <button
                          onClick={() => setDeletingId(product.id)}
                          className="px-3 py-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          ) : (
            /* Table View */
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[900px]">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Level</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Retail Price</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProducts.map((product) => {
                      const stockInfo = getStockInfo(product);
                      const stock = product.stockCache?.stock || 0;
                      return (
                        <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-400">image</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{product.name}</p>
                                <p className="text-xs text-slate-400">{product.productCode || product.categoryTag}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`size-2 rounded-full ${stockInfo.barColor}`}></span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{stock.toLocaleString()}</span>
                              <span className={`text-xs ${stockInfo.color}`}>{stockInfo.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{product.unit}</td>
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                            {formatPrice(product.retailPriceKobo || product.pricePerUnitKobo)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                              product.isActive
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                            }`}>
                              {product.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRepost(product)}
                                className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary transition-all flex items-center justify-center"
                                title="Edit"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button
                                onClick={() => setDeletingId(product.id)}
                                className="size-8 rounded-lg border border-rose-100 dark:border-rose-900/30 text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center"
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
            <div className="size-24 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-5xl text-slate-300">shopping_bag</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {searchQuery || categoryFilter !== "all" || statusFilter !== "all" || stockFilter !== "all"
                  ? "No Matching Products"
                  : "No Products Listed"}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {searchQuery || categoryFilter !== "all" || statusFilter !== "all" || stockFilter !== "all"
                  ? "Try adjusting your filters to find what you're looking for."
                  : "Add your first product to start receiving orders from buyers."}
              </p>
            </div>
            <button
              onClick={() => {
                if (searchQuery || categoryFilter !== "all" || statusFilter !== "all" || stockFilter !== "all") {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                  setStockFilter("all");
                } else {
                  setRepostProduct(null);
                  setIsCreationDrawerOpen(true);
                }
              }}
              className="px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">
                {searchQuery || categoryFilter !== "all" ? "filter_list_off" : "add"}
              </span>
              {searchQuery || categoryFilter !== "all" || statusFilter !== "all" || stockFilter !== "all"
                ? "Clear Filters"
                : "Add First Product"}
            </button>
          </div>
        )}
      </main>

      {/* Product Management Modal */}
      <ProductModal
        isOpen={isCreationDrawerOpen}
        product={repostProduct}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
