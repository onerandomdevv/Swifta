"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { createRFQ } from "@/lib/api/rfq.api";
import { getCatalogue } from "@/lib/api/product.api";
import type { Product } from "@hardware-os/shared";

export default function CreateRFQPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get("productId") || "";

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    productId: preselectedProductId,
    quantity: 1,
    deliveryAddress: "",
    notes: "",
  });

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await getCatalogue();
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        // Products may fail to load — user can still type productId
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createRFQ({
        productId: formData.productId,
        quantity: formData.quantity,
        deliveryAddress: formData.deliveryAddress,
        notes: formData.notes || undefined,
      });
      router.push("/buyer/rfqs");
    } catch (err: any) {
      setError(err?.message || "Failed to create RFQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 space-y-8">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

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
            New Material RFQ
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
            Request a quote from a verified Lagos merchant
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        {error && (
          <div className="mb-8 p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex gap-4">
            <span className="material-symbols-outlined text-red-500">error</span>
            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl shadow-navy-dark/5 space-y-10"
        >
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Select Product
              </label>
              <select
                required
                value={formData.productId}
                onChange={(e) =>
                  setFormData({ ...formData, productId: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all appearance-none"
              >
                <option value="">Choose a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.categoryTag}) — Min: {p.minOrderQuantity} {p.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Quantity Required
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all"
                  placeholder="e.g. 500"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  required
                  value={formData.deliveryAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryAddress: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all"
                  placeholder="Full delivery address in Lagos"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full h-48 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl py-5 px-6 text-sm font-bold text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all resize-none"
                placeholder="Specific brand requirements, delivery time preferences, etc..."
              />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-12 py-5 bg-navy-dark text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-80 flex items-center gap-3"
            >
              {isSubmitting ? "Processing..." : "Submit RFQ"}
              <span className="material-symbols-outlined text-lg">
                rocket_launch
              </span>
            </button>
          </div>
        </form>

        <div className="mt-10 p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2.5rem] border border-dashed border-blue-200 dark:border-blue-900/30 flex items-start gap-6">
          <span className="material-symbols-outlined text-blue-500 font-black">
            gavel
          </span>
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-tight">
            Your RFQ will be sent to the{" "}
            <span className="text-navy-dark dark:text-white font-black">
              merchant who listed this product
            </span>
            . You will receive quotes directly in your dashboard for
            comparison.
          </p>
        </div>
      </div>
    </div>
  );
}
