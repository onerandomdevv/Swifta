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
        const merchantList = Array.isArray(response) ? response : (response as any).data || [];
        setMerchants(merchantList);
      } catch (err: any) {
        setError("Failed to load merchants. You can still submit if you know the merchant ID.");
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
      await queryClient.cancelQueries({ queryKey: ['buyer', 'rfqs'] });
      const previousRfqs = queryClient.getQueryData<RFQ[]>(['buyer', 'rfqs', 'all']);
      
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
        queryClient.setQueryData<RFQ[]>(['buyer', 'rfqs', 'all'], [optimisticRfq as RFQ, ...previousRfqs]);
      }
      return { previousRfqs };
    },
    onError: (err: any, _, context) => {
      setError(err?.message || "Failed to create custom RFQ");
      if (context?.previousRfqs) {
        queryClient.setQueryData(['buyer', 'rfqs', 'all'], context.previousRfqs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer', 'rfqs'] });
    },
    onSuccess: () => {
      router.push("/buyer/rfqs");
    }
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

  const commonUnits = ["pcs", "bags", "tons", "lengths", "kg", "liters", "boxes"];

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-6">
        <button
          onClick={() => router.back()}
          className="size-12 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
            Sourcing Request
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
            Request an unlisted or rare item directly from a merchant
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        {error && (
          <div className="mb-8 p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex gap-4">
            <span className="material-symbols-outlined text-red-500">
              error
            </span>
            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
              {error}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl shadow-navy-dark/5 space-y-10 relative overflow-hidden"
        >
          {/* Decorative Background Icon */}
          <span className="material-symbols-outlined absolute -top-10 -right-10 text-[200px] text-slate-50 dark:text-slate-800/30 pointer-events-none select-none z-0 transform rotate-12">
            package_2
          </span>

          <div className="relative z-10 space-y-8">
            {/* Merchant Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Target Merchant
              </label>
              <select
                required
                value={formData.targetMerchantId}
                onChange={(e) => setFormData({ ...formData, targetMerchantId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all appearance-none"
              >
                <option value="">Select a merchant to send this request to...</option>
                {merchants?.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.businessName} {m.verification === 'VERIFIED' ? '✓' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Item Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50 dark:border-slate-800">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all"
                  placeholder="e.g. Specialized 2.5mm Copper Wire"
                />
              </div>

              <div className="flex gap-4">
                <div className="space-y-3 flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all"
                  />
                </div>
                
                <div className="space-y-3 w-32">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-4 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all appearance-none"
                  >
                    {commonUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Item Description (Optional)
              </label>
              <input
                type="text"
                value={formData.itemDescription}
                onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-sm font-bold text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all"
                placeholder="Specific brands, models, or characteristics..."
              />
            </div>

            {/* Logistics */}
            <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Delivery Address
              </label>
              <input
                type="text"
                required
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all"
                placeholder="Full delivery address in Lagos"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full h-32 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl py-5 px-6 text-sm font-bold text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all resize-none"
                placeholder="Delivery time preferences, unloading instructions..."
              />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex justify-end relative z-10">
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="px-12 py-5 bg-navy-dark text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-80 flex items-center gap-3"
            >
              {isSubmitting ? "Broadcasting..." : "Request Custom Quote"}
              <span className="material-symbols-outlined text-lg">
                send
              </span>
            </button>
          </div>
        </form>

        <div className="mt-10 p-8 bg-purple-50/50 dark:bg-purple-900/10 rounded-[2.5rem] border border-dashed border-purple-200 dark:border-purple-900/30 flex items-start gap-6">
          <span className="material-symbols-outlined text-purple-500 font-black">
            storefront
          </span>
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-tight">
            Can't find a product in the catalogue? Use this sourcing request to ask a merchant to supply an{" "}
            <span className="text-navy-dark dark:text-white font-black">
              unlisted item
            </span>
            . The merchant will review your request and reply with a custom quote directly to your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
