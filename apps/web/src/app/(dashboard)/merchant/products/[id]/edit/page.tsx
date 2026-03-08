"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getProduct,
  updateProduct,
  uploadProductImage,
} from "@/lib/api/product.api";
import { getStock, adjustStock } from "@/lib/api/inventory.api";
import { getCategories } from "@/lib/api/category.api";
import { type Product, type Category } from "@hardware-os/shared";

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
    categoryId: "",
    warehouseLocation: "",
    imageUrl: "",
  });

  const [categories, setCategories] = useState<Category[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Stock state
  const [initialStock, setInitialStock] = useState(0);
  const [currentStock, setCurrentStock] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [productData, stockData, categoriesData] = await Promise.all([
          getProduct(productId) as any as Product,
          getStock(productId).catch(() => ({ stock: 0 })),
          getCategories(),
        ]);

        const product = productData;
        setCategories(categoriesData);
        setFormData({
          name: product.name,
          description: product.description || "",
          unit: product.unit,
          categoryTag: product.categoryTag,
          categoryId: product.categoryId || "",
          minOrderQuantity: product.minOrderQuantity,
          isActive: product.isActive,
          warehouseLocation: product.warehouseLocation || "",
          imageUrl: product.imageUrl || "",
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }

    try {
      setIsUploadingImage(true);
      setError(null);
      const res = await uploadProductImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: res.url }));
    } catch (err: any) {
      setError(err?.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

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
        categoryId: formData.categoryId,
        minOrderQuantity: formData.minOrderQuantity,
        isActive: formData.isActive,
        warehouseLocation: formData.warehouseLocation || undefined,
        imageUrl: formData.imageUrl || undefined,
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
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                Product Image
              </label>
              <div
                onClick={() =>
                  !isUploadingImage && fileInputRef.current?.click()
                }
                className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${formData.imageUrl ? "border-green-400 bg-green-50/50 dark:bg-green-900/10" : "border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50"}`}
              >
                {formData.imageUrl ? (
                  <div className="flex flex-col items-center text-green-600 dark:text-green-500">
                    <span className="material-symbols-outlined text-4xl mb-2">
                      check_circle
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest text-green-700 dark:text-green-400">
                      Image Uploaded
                    </span>
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="h-16 mt-4 rounded border border-green-200"
                    />
                  </div>
                ) : isUploadingImage ? (
                  <div className="flex flex-col items-center">
                    <div className="size-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Uploading...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">
                      add_photo_alternate
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest">
                      Click to Upload Photo
                    </span>
                    <span className="text-[10px] tracking-widest font-bold opacity-60 mt-1">
                      MAX 2MB (JPG, PNG)
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
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
                    <option value="BAGS">Bag</option>
                    <option value="TONNES">Ton</option>
                    <option value="PIECES">Piece</option>
                    <option value="BUNDLES">Bundle</option>
                    <option value="ROLLS">Roll</option>
                    <option value="LENGTHS">Length</option>
                    <option value="KG">Kilogram</option>
                    <option value="SQM">Square Meter</option>
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
                    required
                    value={formData.categoryId}
                    onChange={(e) => {
                      const selectedCat = categories
                        .flatMap((c) => [c, ...(c.children || [])])
                        .find((c) => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        categoryId: e.target.value,
                        categoryTag: selectedCat?.name || "",
                      });
                    }}
                    className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-700 dark:text-slate-300 appearance-none"
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    {categories.map((parent) => (
                      <React.Fragment key={parent.id}>
                        <option
                          value={parent.id}
                          className="font-bold text-slate-900"
                        >
                          {parent.name}
                        </option>
                        {parent.children?.map((child) => (
                          <option key={child.id} value={child.id}>
                            &nbsp;&nbsp;&nbsp;{child.name}
                          </option>
                        ))}
                      </React.Fragment>
                    ))}
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
