"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { createRFQ } from "@/lib/api/rfq.api";
import { getCatalogue } from "@/lib/api/product.api";
import type { Product, RFQ, RFQStatus } from "@hardware-os/shared";

export default function CreateRFQPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const preselectedProductId = searchParams.get("productId") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    productId: preselectedProductId,
    quantity: 1,
    deliveryAddress: "",
    notes: "",
  });

  const selectedProduct = products.find((p) => p.id === formData.productId);
  const minQuantity = selectedProduct?.minOrderQuantity || 1;
  const isBelowMin = formData.productId !== "" && formData.quantity < minQuantity;

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await getCatalogue();
        setProducts(response);
      } catch {
        // Products may fail to load — user can still type productId
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const createMutation = useMutation({
    mutationFn: createRFQ,
    onMutate: async (newRfqData) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['buyer', 'rfqs'] });
      const previousRfqs = queryClient.getQueryData<RFQ[]>(['buyer', 'rfqs', 'all']);
      
      const optimisticRfq: Partial<RFQ> = {
        id: `optimistic-${Date.now()}`,
        productId: newRfqData.productId,
        quantity: newRfqData.quantity,
        deliveryAddress: newRfqData.deliveryAddress,
        notes: newRfqData.notes,
        status: "OPEN" as any,
        createdAt: new Date(),
        merchantId: selectedProduct?.merchantId || "unknown",
        buyerId: "me",
      };

      if (previousRfqs) {
        queryClient.setQueryData<RFQ[]>(['buyer', 'rfqs', 'all'], [optimisticRfq as RFQ, ...previousRfqs]);
      }
      return { previousRfqs };
    },
    onError: (err: any, _, context) => {
      setError(err?.message || "Failed to create RFQ");
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
    createMutation.mutate({
      productId: formData.productId,
      quantity: formData.quantity,
      deliveryAddress: formData.deliveryAddress,
      notes: formData.notes || undefined,
    });
  };

  const isSubmitting = createMutation.isPending;

  if (loading) {
    return (
      <div className="space-y-8 py-4 animate-in fade-in duration-500">
        <Skeleton className="size-10 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-sm" />
          <Skeleton className="h-4 w-96 rounded-sm" />
        </div>
        <div className="bg-white border border-slate-200 rounded p-10 space-y-8">
          <Skeleton className="h-12 w-full rounded-sm" />
          <Skeleton className="h-48 w-full rounded-sm" />
          <Skeleton className="h-12 w-full rounded-sm" />
        </div>
      </div>
    );
  }

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
            NEW MATERIAL RFQ
          </h1>
          <p className="text-primary text-xs font-bold tracking-widest uppercase">
            PROCUREMENT • VERIFIED LAGOS MERCHANTS
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex gap-3">
            <span className="material-symbols-outlined text-red-600">error</span>
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
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                SELECT PRODUCT
              </label>
              <div className="relative">
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => {
                    const newProductId = e.target.value;
                    const prod = products.find((p) => p.id === newProductId);
                    const minQ = prod?.minOrderQuantity || 1;
                    setFormData({ 
                      ...formData, 
                      productId: newProductId,
                      quantity: Math.max(formData.quantity, minQ)
                    });
                  }}
                  className="w-full bg-white border border-slate-300 rounded py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-primary transition-all appearance-none"
                >
                  <option value="">Choose a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.categoryTag}) — Min: {p.minOrderQuantity}{" "}
                      {p.unit}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  QUANTITY REQUIRED
                </label>
                <input
                  type="number"
                  min={minQuantity}
                  required
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  className={`w-full bg-white border rounded py-3 px-4 text-sm font-mono font-medium text-slate-900 outline-none transition-all ${
                    isBelowMin
                      ? "border-red-400 bg-red-50"
                      : "border-slate-300 focus:border-primary"
                  }`}
                  placeholder={`Min: ${minQuantity}`}
                />
                {isBelowMin && (
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight mt-1 ml-1">
                    Minimum order requirement is {minQuantity}.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  DELIVERY ADDRESS
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
                  className="w-full bg-white border border-slate-300 rounded py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-primary transition-all"
                  placeholder="Full delivery address in Lagos"
                />
              </div>
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
                className="w-full h-40 bg-white border border-slate-300 rounded py-3 px-4 text-sm font-medium text-slate-900 outline-none focus:border-primary transition-all resize-none"
                placeholder="Specific brand requirements, delivery time preferences, etc..."
              />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || isBelowMin}
              className="px-8 py-4 bg-primary text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">
                {isSubmitting ? "sync" : "send"}
              </span>
              {isSubmitting ? "PROCESSING..." : "SUBMIT MATERIAL RFQ"}
            </button>
          </div>
        </form>

        <div className="mt-8 p-6 bg-slate-50 rounded border border-slate-200 border-dashed flex items-start gap-4">
          <span className="material-symbols-outlined text-primary font-bold">
            gavel
          </span>
          <p className="text-[12px] font-medium text-slate-600 leading-relaxed uppercase tracking-tight">
            Your RFQ will be sent to the{" "}
            <span className="text-slate-900 font-bold underline decoration-primary decoration-2 underline-offset-2">
              merchant who listed this product
            </span>
            . You will receive quotes directly in your dashboard for comparison.
          </p>
        </div>
      </div>
    </div>
  );
}
