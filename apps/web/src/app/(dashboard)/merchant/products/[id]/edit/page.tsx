"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { productApi } from "@/lib/api/product.api";
import { getStock, adjustStock } from "@/lib/api/inventory.api";
import { getCategories } from "@/lib/api/category.api";
import { type Product, type Category } from "@swifta/shared";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wholesaleEnabled, setWholesaleEnabled] = useState(false);

  // Product state
  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    description: "",
    unit: "PIECES",
    categoryTag: "",
    minOrderQuantity: 10,
    minOrderQuantityConsumer: 1,
    isActive: true,
    categoryId: "",
    warehouseLocation: "",
    imageUrl: "",
    retailPrice: "",
    wholesalePrice: "",
    wholesaleDiscountPercent: 15,
    productCode: "",
    weightKg: "",
    processingDays: "3",
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
          productApi.getProduct(productId) as any as Product,
          getStock(productId).catch(() => ({ stock: 0 })),
          getCategories(),
        ]);

        const product = productData;
        setCategories(categoriesData);

        // Derive wholesale state from existing data
        const hasWholesale = !!(product.wholesalePriceKobo && Number(product.wholesalePriceKobo) > 0);
        setWholesaleEnabled(hasWholesale);

        // Compute discount % from existing wholesale/retail prices if available
        let discountPercent = 15;
        if (hasWholesale && product.wholesaleDiscountPercent) {
          discountPercent = product.wholesaleDiscountPercent;
        } else if (hasWholesale && product.retailPriceKobo && product.wholesalePriceKobo) {
          const retail = Number(product.retailPriceKobo);
          const wholesale = Number(product.wholesalePriceKobo);
          if (retail > 0) {
            discountPercent = Math.round((1 - wholesale / retail) * 100);
          }
        }

        setFormData({
          name: product.name,
          shortDescription: product.shortDescription || "",
          description: product.description || "",
          unit: product.unit || "PIECES",
          categoryTag: product.categoryTag,
          categoryId: product.categoryId || "",
          minOrderQuantity: product.minOrderQuantity || 10,
          minOrderQuantityConsumer: product.minOrderQuantityConsumer || 1,
          isActive: product.isActive,
          warehouseLocation: product.warehouseLocation || "",
          imageUrl: product.imageUrl || "",
          retailPrice: product.retailPriceKobo
            ? (Number(product.retailPriceKobo) / 100).toString()
            : "",
          wholesalePrice: product.wholesalePriceKobo
            ? (Number(product.wholesalePriceKobo) / 100).toString()
            : "",
          wholesaleDiscountPercent: discountPercent,
          productCode: product.productCode || "",
          weightKg: product.weightKg?.toString() || "",
          processingDays: product.processingDays?.toString() || "3",
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
      const res = await productApi.uploadProductImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: res.url }));
    } catch (err: any) {
      setError(err?.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Compute wholesale price for display
  const retailPriceNum = Number(formData.retailPrice) || 0;
  const calculatedWholesalePrice = wholesaleEnabled && retailPriceNum > 0
    ? Math.round(retailPriceNum * (1 - formData.wholesaleDiscountPercent / 100))
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // 1. Update product info
      await productApi.updateProduct(productId, {
        name: formData.name,
        shortDescription: formData.shortDescription || undefined,
        description: formData.description || undefined,
        unit: formData.unit,
        categoryTag: formData.categoryTag,
        categoryId: formData.categoryId,
        minOrderQuantity: wholesaleEnabled ? formData.minOrderQuantity : 10,
        minOrderQuantityConsumer: formData.minOrderQuantityConsumer,
        isActive: formData.isActive,
        warehouseLocation: formData.warehouseLocation || undefined,
        imageUrl: formData.imageUrl || undefined,
        productCode: formData.productCode || undefined,
        weightKg: formData.weightKg ? Number(formData.weightKg) : undefined,
        processingDays: formData.processingDays ? Number(formData.processingDays) : undefined,
        retailPriceKobo: formData.retailPrice
          ? (Number(formData.retailPrice.replace(/,/g, "")) * 100).toString()
          : undefined,
        wholesalePriceKobo: (wholesaleEnabled && formData.wholesalePrice)
          ? (Number(formData.wholesalePrice.replace(/,/g, "")) * 100).toString()
          : undefined,
        wholesaleDiscountPercent: wholesaleEnabled
          ? formData.wholesaleDiscountPercent
          : undefined,
      });

      // 2. Adjust stock if changed
      const stockDelta = currentStock - initialStock;
      if (stockDelta !== 0) {
        await adjustStock(productId, {
          quantity: stockDelta,
          notes: "Manual adjustment from Quick Edit",
        });
      }

      router.push("/merchant/products");
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
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Short Description
                </label>
                <span className={`text-[10px] font-bold tracking-widest ${formData.shortDescription.length >= 90 ? "text-red-500" : "text-slate-400"}`}>
                  {formData.shortDescription.length}/100
                </span>
              </div>
              <input
                value={formData.shortDescription}
                onChange={(e) =>
                  setFormData({ ...formData, shortDescription: e.target.value.substring(0, 100) })
                }
                maxLength={100}
                className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-300 dark:text-white"
                placeholder="Brief summary (max 100 chars)..."
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Full Description
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Product SKU / Code
                </label>
                <input
                  type="text"
                  value={formData.productCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      productCode: e.target.value,
                    })
                  }
                  className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-300 dark:text-white"
                  placeholder="e.g. DG-CEM-50KG"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Warehouse Location
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
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weightKg}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weightKg: e.target.value,
                    })
                  }
                  className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-300 dark:text-white"
                  placeholder="e.g. 50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Processing Time
                </label>
                <div className="relative">
                  <select
                    value={formData.processingDays}
                    onChange={(e) =>
                      setFormData({ ...formData, processingDays: e.target.value })
                    }
                    className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-700 dark:text-slate-300 appearance-none"
                  >
                    <option value="0">Immediate (Same Day)</option>
                    <option value="1">1 Business Day</option>
                    <option value="2">2 Business Days</option>
                    <option value="3">3-5 Business Days</option>
                    <option value="7">1 Week+</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Wholesale */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="material-symbols-outlined text-primary text-xl">
                payments
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Pricing & Wholesale
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Retail Price */}
              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Retail Price (₦) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={formData.retailPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, retailPrice: e.target.value })
                  }
                  className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white"
                  placeholder="e.g. 9000"
                />
              </div>

              {/* Min. Order Qty */}
              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Min. Order Qty <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.minOrderQuantityConsumer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOrderQuantityConsumer: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Wholesale Toggle */}
            <div className="mt-4 p-5 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-xl flex items-center justify-center transition-colors ${wholesaleEnabled ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 dark:bg-slate-700 text-slate-400"}`}>
                    <span className="material-symbols-outlined text-lg">local_offer</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Enable Wholesale
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-bold">
                      Offer a bulk discount for larger orders
                    </p>
                  </div>
                </div>
                <label className="relative flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={wholesaleEnabled}
                    onChange={(e) => setWholesaleEnabled(e.target.checked)}
                  />
                  <div
                    className={`block w-14 h-8 rounded-full transition-colors ${wholesaleEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
                  ></div>
                  <div
                    className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform shadow-sm ${wholesaleEnabled ? "translate-x-6" : ""}`}
                  ></div>
                </label>
              </div>

              {/* Wholesale fields */}
              {wholesaleEnabled && (
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">
                        Wholesale Price (₦)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          value={formData.wholesalePrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const retail = Number(prev.retailPrice) || 0;
                              const wholesale = Number(val) || 0;
                              let discount = prev.wholesaleDiscountPercent;
                              if (retail > 0 && wholesale > 0) {
                                discount = Math.round((1 - wholesale / retail) * 100);
                              }
                              return { ...prev, wholesalePrice: val, wholesaleDiscountPercent: discount };
                            });
                          }}
                          className="w-full px-5 py-4 text-sm font-bold border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl focus:border-emerald-500 transition-all outline-none tabular-nums text-emerald-700 dark:text-emerald-400"
                          placeholder="e.g. 7500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">
                        Discount %
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={formData.wholesaleDiscountPercent}
                          onChange={(e) => {
                            const discount = Math.min(99, Math.max(1, parseInt(e.target.value) || 1));
                            setFormData(prev => {
                              const retail = Number(prev.retailPrice) || 0;
                              const wholesale = retail > 0 ? Math.round(retail * (1 - discount / 100)) : 0;
                              return { ...prev, wholesaleDiscountPercent: discount, wholesalePrice: wholesale.toString() };
                            });
                          }}
                          className="w-full px-5 py-4 pr-10 text-sm font-bold border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl focus:border-emerald-500 transition-all outline-none tabular-nums text-emerald-700 dark:text-emerald-400"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-sm">%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">
                        Min. Wholesale Qty
                      </label>
                      <input
                        type="number"
                        min={2}
                        value={formData.minOrderQuantity}
                        onChange={(e) => setFormData({ ...formData, minOrderQuantity: Math.max(2, parseInt(e.target.value) || 2) })}
                        className="w-full px-5 py-4 text-sm font-bold border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl focus:border-emerald-500 transition-all outline-none tabular-nums text-emerald-700 dark:text-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Calculated wholesale price display */}
                  {retailPriceNum > 0 && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Wholesale Price</p>
                        <p className="text-[10px] font-bold text-emerald-500/70 mt-0.5">
                          {formData.wholesaleDiscountPercent}% off ₦{retailPriceNum.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                        ₦{calculatedWholesalePrice.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Market Status Toggle */}
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
