"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createProduct } from "@/lib/api/product.api";
// import { Step1BasicInfo } from "./steps/Step1BasicInfo";
// import { Step2Inventory } from "./steps/Step2Inventory";
// import { Step3Logistics } from "./steps/Step3Logistics";

export type ProductDraft = {
  name: string;
  categoryTag: string;
  unit: string;
  description: string;
  minOrderQuantity: number;
  initialStock: number; // custom for wizard, submitted via inventory event later if needed or mapped backend
  priceKobo: number;
  deliveryTime: string;
  deliveryZones: string[];
  pickupAvailable: boolean;
};

const INITIAL_DRAFT: ProductDraft = {
  name: "",
  categoryTag: "CEMENT",
  unit: "BAGS",
  description: "",
  minOrderQuantity: 10,
  initialStock: 0,
  priceKobo: 0, // Not saved in V1 product table directly, but mapped to quotes
  deliveryTime: "Same Day",
  deliveryZones: [],
  pickupAvailable: true,
};

export function AddProductWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ProductDraft>(INITIAL_DRAFT);

  const updateDraft = (updates: Partial<ProductDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      // POST to backend API
      const result = await createProduct({
        name: draft.name,
        categoryTag: draft.categoryTag,
        unit: draft.unit,
        description: draft.description,
        minOrderQuantity: draft.minOrderQuantity,
        // other fields like initial stock not in createDto natively, but let's pass what's valid
      });
      return result;
    },
    onSuccess: () => {
      // route back to inventory
      router.push("/merchant/inventory");
    },
    onError: (err) => {
      alert("Failed to create product!");
      console.error(err);
    },
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      router.push("/merchant/inventory");
    } else {
      setStep(step - 1);
    }
  };

  const handlePublish = () => {
    publishMutation.mutate();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Wizard Header (Stepper) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-8 shrink-0 flex items-center justify-center">
        <div className="flex items-center gap-4 w-full max-w-2xl">
          {/* Step 1 */}
          <div className="flex items-center gap-3">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}
            >
              {step > 1 ? (
                <span className="material-symbols-outlined text-sm">check</span>
              ) : (
                "1"
              )}
            </div>
            <span
              className={`text-sm font-bold ${step >= 1 ? "text-slate-900 dark:text-white" : "text-slate-400"}`}
            >
              Basic Info
            </span>
          </div>

          <div
            className={`flex-1 h-px ${step >= 2 ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"}`}
          ></div>

          {/* Step 2 */}
          <div className="flex items-center gap-3">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}
            >
              {step > 2 ? (
                <span className="material-symbols-outlined text-sm">check</span>
              ) : (
                "2"
              )}
            </div>
            <span
              className={`text-sm font-bold ${step >= 2 ? "text-slate-900 dark:text-white" : "text-slate-400"}`}
            >
              Inventory & Pricing
            </span>
          </div>

          <div
            className={`flex-1 h-px ${step >= 3 ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"}`}
          ></div>

          {/* Step 3 */}
          <div className="flex items-center gap-3">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}
            >
              3
            </div>
            <span
              className={`text-sm font-bold ${step >= 3 ? "text-slate-900 dark:text-white" : "text-slate-400"}`}
            >
              Logistics
            </span>
          </div>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Basic Product Information
              </h2>
              {/* STEP 1 FIELDS (temporarily embedded, moved to component in 9.5) */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => updateDraft({ name: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. Dangote Cement 42.5R"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={draft.categoryTag}
                      onChange={(e) =>
                        updateDraft({ categoryTag: e.target.value })
                      }
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                    >
                      <option value="CEMENT">Cement</option>
                      <option value="STEEL">Steel & Iron</option>
                      <option value="ROOFING">Roofing</option>
                      <option value="PLUMBING">Plumbing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Unit of Measure <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={draft.unit}
                      onChange={(e) => updateDraft({ unit: e.target.value })}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                    >
                      <option value="BAGS">Bags</option>
                      <option value="PIECES">Pieces</option>
                      <option value="TONNES">Tonnes</option>
                      <option value="METERS">Meters</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={draft.description}
                    onChange={(e) =>
                      updateDraft({ description: e.target.value })
                    }
                    rows={4}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Describe the grade, origin, and any specific terms."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Inventory & Pricing Config
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Initial Stock Level{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={draft.initialStock}
                      onChange={(e) =>
                        updateDraft({ initialStock: Number(e.target.value) })
                      }
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. 500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Total {draft.unit.toLowerCase()} available in your
                      warehouse.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Min. Order Qty <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={draft.minOrderQuantity}
                      onChange={(e) =>
                        updateDraft({
                          minOrderQuantity: Number(e.target.value),
                        })
                      }
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. 10"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Minimum amount a buyer can request.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Base Unit Price (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={draft.priceKobo / 100}
                    onChange={(e) =>
                      updateDraft({ priceKobo: Number(e.target.value) * 100 })
                    }
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. 7500"
                  />
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-3 mt-4">
                  <div className="mt-0.5">
                    <span className="material-symbols-outlined text-primary text-xl">
                      security
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Private Pricing Enforced
                    </p>
                    <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                      Prices are never published publicly. Base unit prices act
                      as your internal benchmark for generating fast quotes
                      during RFQ negotiations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Logistics & Delivery Modes
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Typical Fulfillment Time{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={draft.deliveryTime}
                    onChange={(e) =>
                      updateDraft({ deliveryTime: e.target.value })
                    }
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                  >
                    <option value="Same Day">Same Day Delivery</option>
                    <option value="1-3 Days">1 - 3 Business Days</option>
                    <option value="3-7 Days">3 - 7 Business Days</option>
                    <option value="On Demand">
                      On Demand (Varies by Zone)
                    </option>
                  </select>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Available for Warehouse Pickup
                      </p>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        Allow contractors to bring their own trucks.
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={draft.pickupAvailable}
                        onChange={(e) =>
                          updateDraft({ pickupAvailable: e.target.checked })
                        }
                      />
                      <div
                        className={`block w-10 h-6 rounded-full transition-colors ${draft.pickupAvailable ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"}`}
                      ></div>
                      <div
                        className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${draft.pickupAvailable ? "translate-x-4" : ""}`}
                      ></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 shrink-0 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {step === 1 ? "Cancel" : "Go Back"}
        </button>

        {step < 3 ? (
          <button
            onClick={handleNext}
            className="px-8 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors flex items-center gap-2"
          >
            Continue to Step {step + 1}
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </button>
        ) : (
          <button
            onClick={handlePublish}
            disabled={publishMutation.isPending}
            className="px-8 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {publishMutation.isPending ? "Publishing..." : "Publish Product"}
            {!publishMutation.isPending && (
              <span className="material-symbols-outlined text-[18px]">
                check_circle
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
