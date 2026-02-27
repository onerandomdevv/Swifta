"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getProduct, updateProduct } from "@/lib/api/product.api";
import { getStock, adjustStock } from "@/lib/api/inventory.api";
import type { Product } from "@hardware-os/shared";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unit: "",
    categoryTag: "",
    minOrderQuantity: 1,
    isActive: true,
    warehouseLocation: "",
  });

  // Stock state
  const [initialStock, setInitialStock] = useState(0);
  const [currentStock, setCurrentStock] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [product, stockData] = await Promise.all([
          getProduct(productId) as any as Product,
          getStock(productId).catch(() => ({ stock: 0 })), // default to 0 if stock fetch fails
        ]);

        setFormData({
          name: product.name,
          description: product.description || "",
          unit: product.unit,
          categoryTag: product.categoryTag,
          minOrderQuantity: product.minOrderQuantity,
          isActive: product.isActive,
          warehouseLocation: product.warehouseLocation || "",
        });

        setInitialStock(stockData.stock);
        setCurrentStock(stockData.stock);
      } catch (err: any) {
        setError(err?.message || "Failed to load product details");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // 1. Update basic product info & status
      await updateProduct(productId, {
        name: formData.name,
        description: formData.description || undefined,
        unit: formData.unit,
        categoryTag: formData.categoryTag,
        minOrderQuantity: formData.minOrderQuantity,
        isActive: formData.isActive,
        warehouseLocation: formData.warehouseLocation || undefined,
      });

      // 2. Adjust stock if changed
      const stockDelta = currentStock - initialStock;
      if (stockDelta !== 0) {
        await adjustStock(productId, {
          quantity: stockDelta,
          notes: "Manual adjustment from Quick Edit",
        });
      }

      router.push("/merchant/inventory");
    } catch (err: any) {
      setError(err?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-8 px-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1 mb-2"
            >
              <span className="material-symbols-outlined text-sm">
                arrow_back
              </span>
              Back to Inventory
            </button>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Quick Edit: <span className="text-primary">{formData.name}</span>
            </h1>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl flex gap-3 items-center shadow-sm">
            <span className="material-symbols-outlined text-red-500">
              error
            </span>
            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
          {/* Section 1: Basic Information */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="material-symbols-outlined text-primary text-xl">
                dataset
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Basic Information
              </h2>
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-300 dark:text-white"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-300 dark:text-white h-24 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Unit of Measure <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-700 dark:text-slate-300 appearance-none"
                  >
                    <option value="bag">Bag</option>
                    <option value="ton">Ton</option>
                    <option value="piece">Piece</option>
                    <option value="bundle">Bundle</option>
                    <option value="roll">Roll</option>
                    <option value="length">Length</option>
                    <option value="kg">Kilogram</option>
                    <option value="sqm">Square Meter</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.categoryTag}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryTag: e.target.value })
                    }
                    className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-700 dark:text-slate-300 appearance-none"
                  >
                    <option value="Building Materials">
                      Building Materials
                    </option>
                    <option value="Metal & Steel">Metal & Steel</option>
                    <option value="Power Tools">Power Tools</option>
                    <option value="Heavy Machinery">Heavy Machinery</option>
                    <option value="Safety Gear">Safety Gear</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Painting">Painting</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Warehouse Location (Optional)
              </label>
              <input
                type="text"
                value={formData.warehouseLocation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    warehouseLocation: e.target.value,
                  })
                }
                className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-300 dark:text-white"
                placeholder="e.g. Zone B, Row 4"
              />
            </div>
          </div>

          {/* Section 2: Inventory & Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="material-symbols-outlined text-primary text-xl">
                inventory_2
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Inventory & Status
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Stock Level <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={currentStock}
                  onChange={(e) =>
                    setCurrentStock(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">
                  Total {formData.unit.toLowerCase()}s currently available.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Min. Order Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.minOrderQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOrderQuantity: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 p-5 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Market Status
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Toggle whether this product is visible to buyers.
                </p>
              </div>
              <label className="relative flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                <div
                  className={`block w-14 h-8 rounded-full transition-colors ${formData.isActive ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"}`}
                ></div>
                <div
                  className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.isActive ? "translate-x-6" : ""}`}
                ></div>
              </label>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-10 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                save
              </span>
              {saving ? "Saving..." : "Save Quick Edit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
