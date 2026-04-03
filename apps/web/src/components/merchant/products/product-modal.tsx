"use client";

import React, { useState, useEffect, useRef } from "react";
import { productApi } from "@/lib/api/product.api";
import { getCategories } from "@/lib/api/category.api";
import { merchantApi } from "@/lib/api/merchant.api";
import { type Category, type Product } from "@twizrr/shared";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
}

export function ProductModal({
  isOpen,
  onClose,
  onSuccess,
  product
}: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    categoryTag: "",
    shortDescription: "",
    description: "",
    retailPrice: "",
    wholesalePrice: "",
    minOrderQuantity: "10",
    productCode: "",
    unit: "unit",
    initialStock: "0",
    warehouseLocation: "",
    imageUrl: "",
    isActive: true,
    weightKg: "",
    processingDays: "3"
  });

  useEffect(() => {
    if (isOpen) {
      setCategoriesLoading(true);
      setCategoriesError(false);
      getCategories()
        .then(setCategories)
        .catch(() => {
           setCategoriesError(true);
           toast.error("Failed to load categories. Please check your connection.");
        })
        .finally(() => setCategoriesLoading(false));
      
      // Always fetch merchant profile to ensure location sync
      merchantApi.getProfile().then(profile => {
        const profileAddress = profile.businessAddress || "";
        
        if (product) {
          setFormData({
            name: product.name || "",
            categoryId: product.categoryId || "",
            categoryTag: product.categoryTag || "",
            shortDescription: product.shortDescription || "",
            description: product.description || "",
            retailPrice: product.retailPriceKobo ? (Number(product.retailPriceKobo) / 100).toString() : "",
            wholesalePrice: product.wholesalePriceKobo ? (Number(product.wholesalePriceKobo) / 100).toString() : "",
            minOrderQuantity: product.minOrderQuantity?.toString() || "10",
            productCode: product.productCode || "",
            unit: product.unit || "unit",
            initialStock: product.stockCache?.stock?.toString() || "0",
            warehouseLocation: profileAddress, // Enforce profile address even in Edit mode
            imageUrl: product.imageUrl || "",
            isActive: product.isActive ?? true,
            weightKg: product.weightKg?.toString() || "",
            processingDays: product.processingDays?.toString() || "3",
          });
        } else {
          setFormData({
            name: "",
            categoryId: "",
            categoryTag: "",
            shortDescription: "",
            description: "",
            retailPrice: "",
            wholesalePrice: "",
            minOrderQuantity: "10",
            productCode: "",
            unit: "unit",
            initialStock: "0",
            warehouseLocation: profileAddress,
            imageUrl: "",
            isActive: true,
            weightKg: "",
            processingDays: "3",
          });
        }
      }).catch(err => {
        console.error("Profile sync failed", err);
        if (product) {
          // Fallback to product data if profile fetch fails
          setFormData({
            name: product.name || "",
            categoryId: product.categoryId || "",
            categoryTag: product.categoryTag || "",
            shortDescription: product.shortDescription || "",
            description: product.description || "",
            retailPrice: product.retailPriceKobo ? (Number(product.retailPriceKobo) / 100).toString() : "",
            wholesalePrice: product.wholesalePriceKobo ? (Number(product.wholesalePriceKobo) / 100).toString() : "",
            minOrderQuantity: product.minOrderQuantity?.toString() || "10",
            productCode: product.productCode || "",
            unit: product.unit || "unit",
            initialStock: product.stockCache?.stock?.toString() || "0",
            warehouseLocation: product.warehouseLocation || "",
            imageUrl: product.imageUrl || "",
            isActive: product.isActive ?? true,
            weightKg: product.weightKg?.toString() || "",
            processingDays: product.processingDays?.toString() || "3",
          });
        }
      });
    }
  }, [isOpen, product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await productApi.uploadProductImage(file);
      setFormData(prev => ({ ...prev, imageUrl: res.url }));
      toast.success("Image updated!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.categoryId || !formData.retailPrice) {
      toast.error("Please fill in required fields (Name, Category, Retail Price)");
      return;
    }

    try {
      setLoading(true);
      const dto = {
        name: formData.name,
        shortDescription: formData.shortDescription,
        description: formData.description,
        unit: formData.unit,
        categoryTag: formData.categoryTag,
        categoryId: formData.categoryId,
        imageUrl: formData.imageUrl || undefined,
        retailPriceKobo: (Number(formData.retailPrice.replace(/,/g, "")) * 100).toString(),
        wholesalePriceKobo: formData.wholesalePrice ? (Number(formData.wholesalePrice.replace(/,/g, "")) * 100).toString() : undefined,
        minOrderQuantity: parseInt(formData.minOrderQuantity) || 10,
        productCode: formData.productCode,
        warehouseLocation: formData.warehouseLocation,
        isActive: formData.isActive,
        weightKg: formData.weightKg ? Number(formData.weightKg) : undefined,
        processingDays: formData.processingDays ? Number(formData.processingDays) : undefined,
        initialStock: product ? undefined : (parseInt(formData.initialStock) || 0),
      };

      if (product) {
        await productApi.updateProduct(product.id, dto as any);
        toast.success("Product updated successfully!");
      } else {
        await productApi.createProduct(dto as any);
        toast.success(formData.isActive ? "Product published!" : "Saved to inventory");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!product) return;
    try {
      setLoading(true);
      await productApi.updateProduct(product.id, { isActive: false } as any);
      toast.success("Product archived");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Failed to archive product");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/40 sm:bg-background/50 sm:backdrop-blur-sm animate-in fade-in duration-300">
      <div className="hidden sm:block fixed inset-0" onClick={onClose} />
      
      {/* Minimal Modal Container */}
      <div className="relative bg-surface w-full max-w-xl rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[95vh] animate-in zoom-in-95 duration-300">
        
        {/* Simplified Header */}
        <div className="px-8 py-6 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">
            {product ? "Edit Listing" : "New Listing"}
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-secondary transition-colors text-foreground-muted"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Minimal Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8 space-y-10">
          
          {/* Subtle Status Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-background-secondary/50 border border-border">
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-widest text-foreground-muted mb-0.5">Visibility</span>
              <span className="text-sm font-bold text-foreground-secondary">
                {formData.isActive ? "Live on Storefront" : "Saved in Inventory"}
              </span>
            </div>
            <label className={cn(
              "relative flex h-6 w-11 cursor-pointer items-center rounded-full transition-all p-1",
              formData.isActive ? "bg-primary shadow-inner" : "bg-background-secondary"
            )}>
              <input 
                type="checkbox" 
                className="sr-only"
                checked={formData.isActive}
                onChange={e => setFormData({...formData, isActive: e.target.checked})}
              />
              <div className={cn(
                "h-4 w-4 rounded-full bg-white shadow-sm transition-transform ring-0",
                formData.isActive ? "translate-x-5" : "translate-x-0"
              )}></div>
            </label>
          </div>

          <div className="space-y-8">
            {/* Minimal Image Upload */}
            <div className="flex flex-col items-center gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative size-32 rounded-3xl overflow-hidden bg-background-secondary/50 border-2 border-dashed border-border hover:border-primary/50 transition-all cursor-pointer flex items-center justify-center"
              >
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Product" />
                ) : (
                  <span className="material-symbols-outlined text-foreground-muted/40 text-3xl transition-transform group-hover:scale-110">image</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-xl">
                    {uploading ? "progress_activity animate-spin" : "edit_square"}
                  </span>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
              </div>
              <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Product Photo</p>
            </div>

            {/* Single Column Form */}
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-foreground-muted">Product Name</label>
                <input 
                  className="w-full bg-transparent border-b border-border py-3 text-lg font-bold text-foreground focus:border-primary outline-none transition-all placeholder:text-foreground-muted/30" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. iPhone 15 Pro Max"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-foreground-muted">Category</label>
                <select 
                  className={cn(
                    "w-full bg-transparent border-b border-border py-3 text-sm font-bold text-foreground focus:border-primary outline-none transition-all appearance-none",
                    categoriesError ? "border-red-500 text-red-500" : ""
                  )}
                  value={formData.categoryId}
                  disabled={categoriesLoading || categoriesError}
                  onChange={e => {
                    const cat = categories.find(c => c.id === e.target.value);
                    setFormData({...formData, categoryId: e.target.value, categoryTag: cat?.name || ""});
                  }}
                >
                  <option value="" className="bg-surface">
                    {categoriesLoading ? "Loading Categories..." : categoriesError ? "Error loading categories" : "Select Category"}
                  </option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-surface">{cat.name}</option>
                  ))}
                </select>
                {categoriesError && (
                  <p className="text-[10px] text-red-500 mt-1 font-medium">Please ensure the backend server and database are running.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-foreground-muted">Retail (₦)</label>
                  <input 
                    className="w-full bg-transparent border-b border-border py-3 text-lg font-bold text-foreground focus:border-primary outline-none transition-all" 
                    value={formData.retailPrice}
                    onChange={e => setFormData({...formData, retailPrice: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-foreground-muted">Wholesale (₦)</label>
                  <input 
                    className="w-full bg-transparent border-b border-border py-3 text-lg font-bold text-foreground focus:border-primary outline-none transition-all" 
                    value={formData.wholesalePrice}
                    onChange={e => setFormData({...formData, wholesalePrice: e.target.value})}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-foreground-muted">Stock Count</label>
                  <input 
                    className="w-full bg-transparent border-b border-border py-3 text-lg font-bold text-foreground focus:border-primary outline-none transition-all" 
                    type="number"
                    value={formData.initialStock}
                    onChange={e => setFormData({...formData, initialStock: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-foreground-muted">Min. Bulk Qty</label>
                  <input 
                    className="w-full bg-transparent border-b border-border py-3 text-lg font-bold text-foreground focus:border-primary outline-none transition-all" 
                    type="number"
                    value={formData.minOrderQuantity}
                    onChange={e => setFormData({...formData, minOrderQuantity: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-foreground-muted">Warehouse Location</label>
                <div className="relative">
                  <input 
                    className="w-full bg-background-secondary border-b border-border py-3 pl-2 pr-10 text-sm font-bold text-foreground-secondary cursor-not-allowed outline-none transition-all" 
                    value={formData.warehouseLocation}
                    readOnly
                    placeholder="Syncing from profile..."
                  />
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted/40 text-lg">lock</span>
                </div>
                <p className="text-[10px] font-medium text-foreground-muted italic">
                  Address is locked to your business profile. Update it in <span className="text-primary font-bold">Profile Settings</span>.
                </p>
              </div>

              {/* Logistics Section */}
              <div className="pt-6 border-t border-border-light space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-foreground-muted text-sm">local_shipping</span>
                  <label className="text-[11px] font-black uppercase tracking-widest text-foreground-muted">Logistics & Delivery</label>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-tight text-foreground-muted">Weight (kg)</label>
                    <input 
                      className="w-full bg-transparent border-b border-border py-3 text-lg font-bold text-foreground focus:border-primary outline-none transition-all" 
                      type="number"
                      step="0.01"
                      value={formData.weightKg}
                      onChange={e => setFormData({...formData, weightKg: e.target.value})}
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-tight text-foreground-muted">Processing Time</label>
                    <select 
                      className="w-full bg-transparent border-b border-border py-3 text-sm font-bold text-foreground focus:border-primary outline-none transition-all appearance-none"
                      value={formData.processingDays}
                      onChange={e => setFormData({...formData, processingDays: e.target.value})}
                    >
                      <option value="0" className="bg-surface">Immediate (Same Day)</option>
                      <option value="1" className="bg-surface">1 Business Day</option>
                      <option value="2" className="bg-surface">2 Business Days</option>
                      <option value="3" className="bg-surface">3-5 Business Days</option>
                      <option value="7" className="bg-surface">1 Week+</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black uppercase tracking-widest text-foreground-muted">Short Description</label>
                  <span className={cn(
                    "text-[10px] font-bold tracking-widest",
                    formData.shortDescription.length >= 90 ? "text-red-500" : "text-foreground-muted"
                  )}>
                    {formData.shortDescription.length}/100
                  </span>
                </div>
                <input 
                  className="w-full bg-transparent border-b border-border py-3 text-sm font-bold text-foreground focus:border-primary outline-none transition-all placeholder:text-foreground-muted/30" 
                  value={formData.shortDescription}
                  onChange={e => setFormData({...formData, shortDescription: e.target.value})}
                  maxLength={100}
                  placeholder="Brief summary (max 100 chars)..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black uppercase tracking-widest text-foreground-muted">More Description</label>
                  <span className={cn(
                    "text-[10px] font-bold tracking-widest text-foreground-muted"
                  )}>
                    {formData.description.length}/2000
                  </span>
                </div>
                <textarea 
                  className="w-full bg-transparent border-b border-border py-3 text-sm font-medium text-foreground-secondary focus:border-primary outline-none transition-all resize-none" 
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  maxLength={2000}
                  placeholder="Key features..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Footer Actions */}
        <div className="px-8 py-6 flex items-center justify-between bg-background-secondary/50 border-t border-border">
          {product ? (
            <button 
              onClick={handleArchive}
              disabled={loading}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50"
            >
              Archive
            </button>
          ) : (
             <div />
          )}
          <div className="flex gap-4">
            <button 
              onClick={handleSubmit}
              disabled={loading || categoriesError}
              className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              {product ? "Update" : "List Product"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}
