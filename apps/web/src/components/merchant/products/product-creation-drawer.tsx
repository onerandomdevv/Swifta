"use client";

import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct, uploadProductImage } from "@/lib/api/product.api";
import { getCategories } from "@/lib/api/category.api";
import { type Category } from "@hardware-os/shared";
import { useToast } from "@/providers/toast-provider";

interface ProductCreationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "VISUALS" | "DETAILS" | "PRICING" | "SUCCESS";

export function ProductCreationDrawer({
  isOpen,
  onClose,
  onSuccess,
}: ProductCreationDrawerProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<Step>("VISUALS");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [wholesaleEnabled, setWholesaleEnabled] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unit: "BAGS",
    categoryTag: "",
    categoryId: "",
    minOrderQuantity: 1,
    minOrderQuantityConsumer: 1,
    imageUrl: "",
    retailPrice: "",
    wholesaleDiscountPercent: 15,
  });

  useEffect(() => {
    if (isOpen) {
      async function loadCategories() {
        try {
          const data = await getCategories();
          setCategories(data);
        } catch (err) {
          console.error("Failed to load categories", err);
        }
      }
      loadCategories();
      // Reset form on open
      setFormData({
        name: "",
        description: "",
        unit: "BAGS",
        categoryTag: "",
        categoryId: "",
        minOrderQuantity: 1,
        minOrderQuantityConsumer: 1,
        imageUrl: "",
        retailPrice: "",
        wholesaleDiscountPercent: 15,
      });
      setWholesaleEnabled(false);
      setCurrentStep("VISUALS");
    }
  }, [isOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    try {
      setIsUploadingImage(true);
      const res = await uploadProductImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: res.url }));
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Compute wholesale price for display
  const retailPriceNum = Number(formData.retailPrice) || 0;
  const calculatedWholesalePrice = wholesaleEnabled && retailPriceNum > 0
    ? Math.round(retailPriceNum * (1 - formData.wholesaleDiscountPercent / 100))
    : 0;

  const createMutation = useMutation({
    mutationFn: () =>
      createProduct({
        name: formData.name,
        description: formData.description || undefined,
        unit: formData.unit,
        categoryTag: formData.categoryTag,
        categoryId: formData.categoryId,
        minOrderQuantity: wholesaleEnabled ? formData.minOrderQuantity : 1,
        minOrderQuantityConsumer: formData.minOrderQuantityConsumer,
        imageUrl: formData.imageUrl || undefined,
        retailPriceKobo: formData.retailPrice
          ? (Number(formData.retailPrice) * 100).toString()
          : undefined,
        wholesaleDiscountPercent: wholesaleEnabled
          ? formData.wholesaleDiscountPercent
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant", "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["merchant", "dashboard"] });
      setCurrentStep("SUCCESS");
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create product listing");
    },
  });

  const nextStep = () => {
    if (currentStep === "VISUALS") {
      if (!formData.categoryId) return toast.error("Please select a category");
      setCurrentStep("DETAILS");
    } else if (currentStep === "DETAILS") {
      if (!formData.name) return toast.error("Product name is required");
      setCurrentStep("PRICING");
    }
  };

  const prevStep = () => {
    if (currentStep === "DETAILS") setCurrentStep("VISUALS");
    else if (currentStep === "PRICING") setCurrentStep("DETAILS");
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-navy-dark/40 backdrop-blur-[2px] z-[100] transition-opacity duration-500 animate-in fade-in"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full md:w-[45%] lg:w-[35%] bg-white dark:bg-slate-900 z-[101] shadow-[-20px_0_50px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">
              Command Center
            </p>
            <h2 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tighter">
              {currentStep === "SUCCESS" ? "Listing Active" : "List New Material"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-navy-dark dark:hover:text-white transition-all shadow-sm hover:shadow-md active:scale-90"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Progress Bar */}
        {currentStep !== "SUCCESS" && (
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-navy-dark dark:bg-primary transition-all duration-500"
              style={{
                width:
                  currentStep === "VISUALS"
                    ? "33.33%"
                    : currentStep === "DETAILS"
                      ? "66.66%"
                      : "100%",
              }}
            />
          </div>
        )}

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          {currentStep === "VISUALS" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Step 1: Visual Identity & Classification
                </label>
                <div
                  onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                  className={`relative w-full aspect-video border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${
                    formData.imageUrl
                      ? "border-emerald-400 bg-emerald-50/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-navy-dark dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50"
                  }`}
                >
                  {formData.imageUrl ? (
                    <>
                      <img
                        src={formData.imageUrl}
                        alt="Product"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-navy-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]">
                        <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                      </div>
                    </>
                  ) : isUploadingImage ? (
                    <div className="flex flex-col items-center">
                      <div className="size-10 border-4 border-slate-200 border-t-navy-dark dark:border-t-primary rounded-full animate-spin mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing to Cloud...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 group-hover:text-navy-dark dark:group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-5xl mb-3">image</span>
                      <p className="text-[10px] font-black uppercase tracking-widest">Add Product Surface</p>
                      <p className="text-[10px] font-bold opacity-60 mt-1">Recommended: 1200x800px</p>
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

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Market Classification
                </label>
                <div className="grid grid-cols-1 gap-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFormData({ ...formData, categoryId: cat.id, categoryTag: cat.name })}
                      className={`p-6 rounded-[1.5rem] border-2 text-left transition-all ${
                        formData.categoryId === cat.id
                          ? "border-navy-dark bg-navy-dark text-white shadow-xl shadow-navy-dark/20 scale-[1.02]"
                          : "border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`material-symbols-outlined text-2xl ${formData.categoryId === cat.id ? "text-primary" : "text-slate-400"}`}>
                          {cat.icon || "category"}
                        </span>
                        <div>
                          <p className={`text-sm font-black uppercase tracking-tight ${formData.categoryId === cat.id ? "text-white" : "text-navy-dark dark:text-white"}`}>
                            {cat.name}
                          </p>
                          <p className={`text-[10px] font-bold ${formData.categoryId === cat.id ? "text-white/60" : "text-slate-400"}`}>
                            {cat.children?.length || 0} Sub-sectors available
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === "DETAILS" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Material Denomination
                </label>
                <input
                  autoFocus
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dangote Cement 3X (50kg)"
                  className="w-full p-6 text-xl font-black border-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 rounded-[1.5rem] focus:border-navy-dark dark:focus:border-primary focus:bg-white transition-all outline-none placeholder:text-slate-300 dark:text-white uppercase tracking-tighter"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Technical Specifications
                  </label>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {formData.description.split(/\s+/).filter(Boolean).length} / 100 Words
                  </span>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed material transparency - origin, grade, quality certificates..."
                  className="w-full p-6 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 rounded-[2rem] focus:border-navy-dark dark:focus:border-primary focus:bg-white transition-all outline-none h-48 resize-none dark:text-white"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Inventory Protocol (Unit)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["BAGS", "TONNES", "PIECES", "BUNDLES", "ROLLS", "LENGTHS", "KG", "SQM"].map((u) => (
                    <button
                      key={u}
                      onClick={() => setFormData({ ...formData, unit: u })}
                      className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        formData.unit === u
                          ? "border-navy-dark bg-navy-dark text-white"
                          : "border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-400 hover:border-slate-200"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === "PRICING" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Retail Price — always visible */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Retail Price (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-navy-dark/20 font-mono">₦</span>
                  <input
                    type="number"
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                    placeholder="9,000"
                    className="w-full p-6 pl-12 text-2xl font-black border-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 rounded-[1.5rem] focus:border-navy-dark dark:focus:border-primary transition-all outline-none tabular-nums dark:text-white"
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 ml-1">Standard price per {formData.unit.toLowerCase()}</p>
              </div>

              {/* Min Retail Order */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Minimum Order Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.minOrderQuantityConsumer}
                  onChange={(e) => setFormData({ ...formData, minOrderQuantityConsumer: parseInt(e.target.value) || 1 })}
                  className="w-full p-6 text-sm font-black border-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 rounded-[1.5rem] focus:border-navy-dark transition-all outline-none text-navy-dark dark:text-white"
                />
                <p className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Smallest order a buyer can place</p>
              </div>

              {/* Wholesale Toggle */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                <div className="p-6 rounded-[1.5rem] border-2 border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${wholesaleEnabled ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 dark:bg-slate-700 text-slate-400"}`}>
                        <span className="material-symbols-outlined text-xl">local_offer</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-tight">
                          Enable Wholesale
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
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
                      <div className={`block w-14 h-8 rounded-full transition-colors ${wholesaleEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform shadow-sm ${wholesaleEnabled ? "translate-x-6" : ""}`}></div>
                    </label>
                  </div>

                  {/* Wholesale fields — revealed on toggle */}
                  {wholesaleEnabled && (
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">
                            Discount %
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={formData.wholesaleDiscountPercent}
                              onChange={(e) => setFormData({ ...formData, wholesaleDiscountPercent: Math.min(99, Math.max(1, parseInt(e.target.value) || 1)) })}
                              className="w-full p-5 pr-10 text-lg font-black border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl focus:border-emerald-500 transition-all outline-none tabular-nums text-emerald-700 dark:text-emerald-400"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 font-black">%</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">
                            Min. Qty
                          </label>
                          <input
                            type="number"
                            min={2}
                            value={formData.minOrderQuantity}
                            onChange={(e) => setFormData({ ...formData, minOrderQuantity: Math.max(2, parseInt(e.target.value) || 2) })}
                            className="w-full p-5 text-lg font-black border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl focus:border-emerald-500 transition-all outline-none tabular-nums text-emerald-700 dark:text-emerald-400"
                          />
                        </div>
                      </div>

                      {/* Calculated wholesale price */}
                      {retailPriceNum > 0 && (
                        <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Wholesale Price</p>
                            <p className="text-[10px] font-bold text-emerald-500/70 mt-0.5">
                              Auto-calculated: {formData.wholesaleDiscountPercent}% off ₦{retailPriceNum.toLocaleString()}
                            </p>
                          </div>
                          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                            ₦{calculatedWholesalePrice.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === "SUCCESS" && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-700">
              <div className="size-32 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <span className="material-symbols-outlined text-6xl text-white">verified</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-navy-dark dark:text-white uppercase tracking-tighter">Material Live</h3>
                <p className="text-slate-500 font-bold max-w-xs mx-auto leading-relaxed">
                  Your listing protocol has been successfully executed. The industrial market can now discover your inventory.
                </p>
              </div>
              <button
                onClick={() => {
                  setCurrentStep("VISUALS");
                  setFormData({
                    name: "",
                    description: "",
                    unit: "BAGS",
                    categoryTag: "",
                    categoryId: "",
                    minOrderQuantity: 1,
                    minOrderQuantityConsumer: 1,
                    imageUrl: "",
                    retailPrice: "",
                    wholesaleDiscountPercent: 15,
                  });
                  setWholesaleEnabled(false);
                }}
                className="px-10 py-5 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                List Another Surface
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {currentStep !== "SUCCESS" && (
          <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <button
              onClick={currentStep === "VISUALS" ? onClose : prevStep}
              className="px-8 py-5 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-navy-dark dark:hover:text-white transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">
                {currentStep === "VISUALS" ? "close" : "arrow_back"}
              </span>
              {currentStep === "VISUALS" ? "Abort Protocol" : "Backtrack"}
            </button>

            <button
              onClick={currentStep === "PRICING" ? () => createMutation.mutate() : nextStep}
              disabled={createMutation.isPending || (currentStep === "VISUALS" && !formData.categoryId)}
              className="px-10 py-5 bg-navy-dark dark:bg-primary text-white dark:text-navy-dark rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-navy-dark/20 dark:shadow-primary/10 flex items-center gap-3 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0"
            >
              <span>{createMutation.isPending ? "Executing..." : currentStep === "PRICING" ? "Initialize Listing" : "Proceed"}</span>
              <span className="material-symbols-outlined text-lg">
                {currentStep === "PRICING" ? "bolt" : "arrow_forward"}
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
