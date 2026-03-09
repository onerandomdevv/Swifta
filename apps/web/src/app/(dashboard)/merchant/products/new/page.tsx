"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createProduct, uploadProductImage } from "@/lib/api/product.api";
import { getCategories } from "@/lib/api/category.api";
import { type Category } from "@hardware-os/shared";

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unit: "BAGS",
    categoryTag: "",
    categoryId: "",
    minOrderQuantity: 1,
    minOrderQuantityConsumer: 1,
    imageUrl: "",
    pricePerUnit: "",
    retailPrice: "",
  });

  React.useEffect(() => {
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

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };
  const wordCount = getWordCount(formData.description);
  const isOverWordLimit = wordCount > 100;

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
    setLoading(true);

    try {
      await createProduct({
        name: formData.name,
        description: formData.description || undefined,
        unit: formData.unit,
        categoryTag: formData.categoryTag,
        categoryId: formData.categoryId,
        minOrderQuantity: formData.minOrderQuantity,
        minOrderQuantityConsumer: formData.minOrderQuantityConsumer,
        imageUrl: formData.imageUrl || undefined,
        pricePerUnitKobo: formData.pricePerUnit
          ? (Number(formData.pricePerUnit) * 100).toString()
          : undefined,
        retailPriceKobo: formData.retailPrice
          ? (Number(formData.retailPrice) * 100).toString()
          : undefined,
      });
      router.push("/merchant/products");
    } catch (err: any) {
      setError(err?.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <button
          onClick={() => router.back()}
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-navy-dark transition-colors mb-4"
        >
          &larr; Back to Catalog
        </button>
        <h1 className="text-3xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
          List New Product
        </h1>
        <p className="text-slate-500 font-bold text-sm">
          Add a new product to your marketplace catalog.
        </p>
      </div>

      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex gap-4">
          <span className="material-symbols-outlined text-red-500">error</span>
          <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
            {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Product Image
          </label>
          <div
            onClick={() => !isUploadingImage && fileInputRef.current?.click()}
            className={`w-full h-48 border-2 border-dashed rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer transition-all ${formData.imageUrl ? "border-green-400 bg-green-50/50 dark:bg-green-900/10" : "border-slate-200 dark:border-slate-800 hover:border-navy-dark dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900/50"}`}
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
                <div className="size-8 border-4 border-slate-200 border-t-navy-dark rounded-full animate-spin mb-4" />
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
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Product Name
          </label>
          <input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white"
            placeholder="e.g. Elephant Cement (50kg)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Business Price (₦)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={formData.pricePerUnit}
              onChange={(e) =>
                setFormData({ ...formData, pricePerUnit: e.target.value })
              }
              className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white"
              placeholder="e.g. 8500"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">person</span>
              Retail Price (₦) - For Consumers
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={formData.retailPrice}
              onChange={(e) =>
                setFormData({ ...formData, retailPrice: e.target.value })
              }
              className="w-full px-8 py-5 text-sm font-bold border-2 border-primary/10 dark:border-primary/20 bg-primary/5 dark:bg-primary/10 rounded-[1.5rem] focus:border-primary outline-none transition-all placeholder:text-primary/30 dark:text-white"
              placeholder="e.g. 9000"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Description
            </label>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${isOverWordLimit ? "text-red-500" : "text-slate-400"}`}
            >
              {wordCount} / 100 Words
            </span>
          </div>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className={`w-full px-8 py-5 text-sm font-bold border-2 rounded-[1.5rem] focus:outline-none transition-all placeholder:text-slate-300 dark:text-white h-32 resize-none ${
              isOverWordLimit
                ? "border-red-400 focus:border-red-500 bg-red-50 dark:bg-red-900/10"
                : "border-slate-50 dark:border-slate-800 dark:bg-slate-950 focus:border-navy-dark"
            }`}
            placeholder="Describe the product specifications, quality, origin..."
          />
          {isOverWordLimit && (
            <p className="text-xs font-bold text-red-500 mt-1 ml-2">
              Description must be up to 100 words maximum.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Unit of Measure
            </label>
            <select
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
              className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all text-slate-400 appearance-none bg-transparent"
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
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Category
            </label>
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
              className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all text-slate-400 appearance-none bg-transparent"
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Business Min Order
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
              className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all dark:text-white"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">person</span>
              Consumer Min Order
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
              className="w-full px-8 py-5 text-sm font-bold border-2 border-primary/10 dark:border-primary/20 bg-primary/5 dark:bg-primary/10 rounded-[1.5rem] focus:border-primary outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={loading || isOverWordLimit}
            className="px-10 py-5 bg-navy-dark text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-navy-dark/30 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
          >
            {loading ? "Creating..." : "Create Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
