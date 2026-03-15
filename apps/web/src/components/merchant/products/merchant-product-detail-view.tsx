"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { productApi } from "@/lib/api/product.api";
import { getMerchantReviews } from "@/lib/api/review.api";
import type { Product, Review } from "@hardware-os/shared";
import { toast } from "sonner";
import { cn, formatKobo, optimizeCloudinaryUrl } from "@/lib/utils";

interface MerchantProductDetailViewProps {
  productId: string;
}

export function MerchantProductDetailView({ productId }: MerchantProductDetailViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'reviews'>('description');
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productApi.getProduct(productId);
        setProduct(data);
      } catch (err: any) {
        toast.error(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (product?.merchantId && activeTab === 'reviews') {
      const fetchReviews = async () => {
        try {
          const reviewsData = await getMerchantReviews(product.merchantId, 1, 10);
          // Filter reviews for this specific product if the API supports it, 
          // but for now showing merchant reviews as per design intent of "Review Logs"
          setReviews(reviewsData);
        } catch (err) {
          console.error("Failed to load reviews:", err);
        }
      };
      fetchReviews();
    }
  }, [product?.merchantId, activeTab]);

  const handleCopySKU = () => {
    if (product?.productCode) {
      navigator.clipboard.writeText(product.productCode);
      setCopiedId(true);
      toast.success("SKU copied to clipboard");
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;

    try {
      await productApi.deleteProduct(product.id);
      toast.success("Product deleted successfully");
      router.push("/merchant/products");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Product Data...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4 flex flex-col items-center">
        <span className="material-symbols-outlined text-5xl text-red-400">inventory_2</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Product Not Found</h2>
        <p className="text-slate-500">The product you are looking for does not exist or has been removed.</p>
        <button onClick={() => router.back()} className="px-6 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const isLowStock = (product.stockCache?.stock ?? 0) <= 5 && (product.stockCache?.stock ?? 0) > 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden font-display">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-500 hover:text-primary transition-colors text-sm font-medium">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <nav className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Products</span>
            <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDelete}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Delete
          </button>
          <button 
            onClick={() => router.push(`/merchant/products/${product.id}/edit`)}
            className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Edit Product
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 bg-[#f8f6f6] dark:bg-[#221610]">
        <div className="max-w-6xl mx-auto">
          {/* Main Product Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Gallery */}
            <div className="lg:col-span-5 space-y-4">
              <div className="aspect-square bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                {product.imageUrl ? (
                  <img src={optimizeCloudinaryUrl(product.imageUrl, 800)} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <span className="material-symbols-outlined text-6xl text-slate-300">inventory_2</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="aspect-square rounded-xl border-2 border-primary overflow-hidden cursor-pointer ring-2 ring-primary/20 bg-white shadow-sm">
                   {product.imageUrl && <img src={optimizeCloudinaryUrl(product.imageUrl, 150)} alt="Thumbnail" className="w-full h-full object-cover" />}
                </div>
                <div className="aspect-square rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-slate-400">add_photo_alternate</span>
                </div>
              </div>
            </div>

            {/* Right Column: Details */}
            <div className="lg:col-span-7 space-y-8">
              {/* Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded">
                    {product.categoryTag || "Construction"}
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    Verified
                  </div>
                </div>
                <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {product.name}
                </h2>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg group shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase">SKU</span>
                    <span className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300">
                      {product.productCode || "PENDING"}
                    </span>
                    <button 
                      onClick={handleCopySKU}
                      className="material-symbols-outlined text-sm text-slate-400 hover:text-primary transition-colors"
                    >
                      {copiedId ? 'check' : 'content_copy'}
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-500">Status</span>
                      <div className={cn(
                        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                        product.isActive ? "bg-primary" : "bg-slate-300"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                          product.isActive ? "left-5.5" : "left-0.5"
                        )} />
                      </div>
                    </div>
                    {isLowStock && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-100 dark:border-amber-900/30">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span className="text-xs font-bold">Low Stock</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Retail Price</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatKobo(Number(product.retailPriceKobo || 0))}
                    </span>
                    <span className="text-xs text-slate-400">/ {product.unit || "unit"}</span>
                  </div>
                  <p className="text-[10px] mt-2 text-emerald-600 font-medium">Standard selling price</p>
                </div>
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Wholesale Price</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatKobo(Number(product.wholesalePriceKobo || 0))}
                    </span>
                    <span className="text-xs text-slate-400">/ unit</span>
                  </div>
                  <p className="text-[10px] mt-2 text-slate-500 font-medium">Min. order: {product.minOrderQuantity} units</p>
                </div>
              </div>

              {/* Inventory Stats */}
              <div className="grid grid-cols-3 gap-6 py-6 border-y border-slate-100 dark:border-slate-800">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Sales</p>
                  <p className="text-lg font-bold">0</p>
                </div>
                <div className="text-center border-x border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Stock Level</p>
                  <p className={cn("text-lg font-bold", isLowStock ? "text-amber-500" : "text-primary")}>
                    {product.stockCache?.stock ?? 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Revenue</p>
                  <p className="text-lg font-bold">₦0.00</p>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="space-y-6">
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                  <button 
                    onClick={() => setActiveTab('description')}
                    className={cn(
                      "px-6 py-3 text-sm font-bold transition-all",
                      activeTab === 'description' ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Description
                  </button>
                  <button 
                    onClick={() => setActiveTab('details')}
                    className={cn(
                      "px-6 py-3 text-sm font-bold transition-all",
                      activeTab === 'details' ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Product Details
                  </button>
                  <button 
                    onClick={() => setActiveTab('reviews')}
                    className={cn(
                      "px-6 py-3 text-sm font-bold transition-all",
                      activeTab === 'reviews' ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Review Logs
                  </button>
                </div>
                
                <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed min-h-[100px]">
                  {activeTab === 'description' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <p>{product.description || "No description available for this product."}</p>
                    </div>
                  )}

                  {activeTab === 'details' && (
                    <div className="grid grid-cols-2 gap-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Unit Type</p>
                        <p className="font-medium text-slate-900 dark:text-white capitalize">{product.unit || "Unit"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Warehouse Location</p>
                        <p className="font-medium text-slate-900 dark:text-white">{product.warehouseLocation || "Main Warehouse"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Wholesale Min. Qty</p>
                        <p className="font-medium text-slate-900 dark:text-white font-mono">{product.minOrderQuantity} units</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Created On</p>
                        <p className="font-medium text-slate-900 dark:text-white">{new Date(product.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {reviews.length > 0 ? (
                        reviews.map((r, i) => (
                          <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-1">
                              <p className="font-bold text-slate-900 dark:text-white text-xs">Customer Response</p>
                              <div className="flex text-amber-500">
                                {Array.from({length: 5}).map((_, idx) => (
                                  <span key={idx} className="material-symbols-outlined text-xs" style={{ fontVariationSettings: `'FILL' ${idx < (r as any).rating ? 1 : 0}` }}>star</span>
                                ))}
                              </div>
                            </div>
                            <p className="text-xs italic text-slate-500">&quot;{r.comment}&quot;</p>
                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center">
                          <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">rate_review</span>
                          <p className="text-slate-500 font-medium">No customer reviews yet</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Action Area */}
              <div className="flex items-center gap-4 pt-4">
                <button 
                  onClick={() => router.push(`/merchant/products/${product.id}/edit`)}
                  className="flex-1 bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined">edit</span>
                  Manage Inventory
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + `/buyer/products/${product.id}`);
                    toast.success("Public product link copied!");
                  }}
                  className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors active:scale-95 bg-white dark:bg-slate-900"
                >
                  <span className="material-symbols-outlined text-slate-500">share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
