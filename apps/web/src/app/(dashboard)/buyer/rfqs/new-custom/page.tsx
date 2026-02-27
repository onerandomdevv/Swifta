"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRFQ } from "@/lib/api/rfq.api";
import { getMerchants } from "@/lib/api/merchant.api";
import type { RFQ } from "@hardware-os/shared";

export default function CreateCustomRFQPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [merchants, setMerchants] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    targetMerchantId: "",
    itemName: "",
    itemDescription: "",
    unit: "pcs",
    quantity: 1,
    deliveryAddress: "",
    notes: "",
  });

  useEffect(() => {
    async function fetchMerchants() {
      try {
        const response = await getMerchants();
        // Extract merchants containing id and businessName
        // If response is paginated { data, meta }, extract data
        const merchantList = Array.isArray(response)
          ? response
          : (response as any).data || [];
        setMerchants(merchantList);
      } catch (err: any) {
        setError(
          "Failed to load merchants. You can still submit if you know the merchant ID.",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchMerchants();
  }, []);

  const createMutation = useMutation({
    mutationFn: createRFQ,
    onMutate: async (newRfqData) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["buyer", "rfqs"] });
      const previousRfqs = queryClient.getQueryData<RFQ[]>([
        "buyer",
        "rfqs",
        "all",
      ]);

      const optimisticRfq: Partial<RFQ> = {
        id: `optimistic-${Date.now()}`,
        productId: "custom",
        quantity: newRfqData.quantity,
        deliveryAddress: newRfqData.deliveryAddress,
        notes: newRfqData.notes,
        status: "OPEN" as any,
        createdAt: new Date(),
        merchantId: newRfqData.targetMerchantId || "unknown",
        buyerId: "me",
      };

      if (previousRfqs) {
        queryClient.setQueryData<RFQ[]>(
          ["buyer", "rfqs", "all"],
          [optimisticRfq as RFQ, ...previousRfqs],
        );
      }
      return { previousRfqs };
    },
    onError: (err: any, _, context) => {
      setError(err?.message || "Failed to create custom RFQ");
      if (context?.previousRfqs) {
        queryClient.setQueryData(
          ["buyer", "rfqs", "all"],
          context.previousRfqs,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer", "rfqs"] });
    },
    onSuccess: () => {
      router.push("/buyer/rfqs");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.targetMerchantId) {
      setError("Please select a target merchant to send this request to.");
      return;
    }

    createMutation.mutate({
      targetMerchantId: formData.targetMerchantId,
      unlistedItemDetails: {
        name: formData.itemName,
        description: formData.itemDescription || undefined,
        unit: formData.unit,
      },
      quantity: formData.quantity,
      deliveryAddress: formData.deliveryAddress,
      notes: formData.notes || undefined,
    });
  };

  const isSubmitting = createMutation.isPending;

  const commonUnits = [
    "pcs",
    "bags",
    "tons",
    "lengths",
    "kg",
    "liters",
    "boxes",
  ];

  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="size-10 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div className="space-y-0.5">
          <h1 className="text-[28px] font-bold uppercase tracking-tight leading-tight">
            SOURCING REQUEST
          </h1>
          <p className="text-primary text-xs font-bold tracking-widest uppercase">
            UNLISTED ITEM • DIRECT MERCHANT INQUIRY
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex gap-3">
            <span className="material-symbols-outlined text-red-600">
              error
            </span>
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide flex items-center">
              {error}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded p-8 shadow-sm space-y-8"
        >
          <div className="space-y-6">
            {/* Merchant Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                TARGET MERCHANT
              </label>
              <div className="relative">
                <select
                  required
                  value={formData.targetMerchantId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetMerchantId: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-primary transition-all appearance-none"
                >
                  <option value="">
                    Select a merchant to send this request to...
                  </option>
                  {merchants?.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.businessName}{" "}
                      {m.verification === "VERIFIED" ? "✓" : ""}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Custom Item Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  ITEM NAME
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) =>
                    setFormData({ ...formData, itemName: e.target.value })
                  }
                  className="w-full bg-white border border-slate-300 rounded py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-primary transition-all"
                  placeholder="e.g. Specialized 2.5mm Copper Wire"
                />
              </div>

              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    QUANTITY
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded py-3 px-4 text-sm font-mono font-medium text-slate-900 outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2 w-32">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    UNIT
                  </label>
                  <div className="relative">
                    <select
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-primary transition-all appearance-none"
                    >
                      {commonUnits.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                ITEM DESCRIPTION (OPTIONAL)
              </label>
              <input
                type="text"
                value={formData.itemDescription}
                onChange={(e) =>
                  setFormData({ ...formData, itemDescription: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded py-3 px-4 text-sm font-medium text-slate-900 outline-none focus:border-primary transition-all"
                placeholder="Specific brands, models, or characteristics..."
              />
            </div>

            {/* Logistics */}
            <div className="space-y-2 pt-6 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                DELIVERY ADDRESS
              </label>
              <input
                type="text"
                required
                value={formData.deliveryAddress}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryAddress: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-primary transition-all"
                placeholder="Full delivery address in Lagos"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                ADDITIONAL NOTES (OPTIONAL)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full h-32 bg-white border border-slate-300 rounded py-3 px-4 text-sm font-medium text-slate-900 outline-none focus:border-primary transition-all resize-none"
                placeholder="Delivery time preferences, unloading instructions..."
              />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="px-8 py-4 bg-primary text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              {isSubmitting ? "BROADCASTING..." : "REQUEST CUSTOM QUOTE"}
            </button>
          </div>
        </form>

        <div className="mt-8 p-6 bg-slate-50 rounded border border-slate-200 border-dashed flex items-start gap-4">
          <span className="material-symbols-outlined text-primary font-bold">
            info
          </span>
          <p className="text-[12px] font-medium text-slate-600 leading-relaxed uppercase tracking-tight">
            Can't find a product in the catalogue? Use this sourcing request to
            ask a merchant to supply an{" "}
            <span className="text-slate-900 font-bold underline decoration-primary decoration-2 underline-offset-2">
              unlisted item
            </span>
            . The merchant will review your request and reply with a custom
            quote directly to your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
