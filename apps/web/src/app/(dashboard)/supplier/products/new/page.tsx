"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createSupplierProduct } from "@/lib/api/supplier.api";
import { useToast } from "@/providers/toast-provider";

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  category: z.string().min(2, "Category is required"),
  wholesalePriceKobo: z.coerce.number().min(1, "Price must be greater than 0"),
  minOrderQty: z.coerce
    .number()
    .min(1, "Minimum order quantity must be at least 1"),
  unit: z.string().min(1, "Unit is required (e.g., Bag, Ton, Pallet)"),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewWholesaleProductPage() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "",
      category: "",
      wholesalePriceKobo: 0,
      minOrderQty: 1,
      unit: "Bag",
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      await createSupplierProduct({
        ...values,
        wholesalePriceKobo: Number(values.wholesalePriceKobo),
      });
      toast.success("Wholesale product listed successfully!");
      router.push("/supplier/products");
    } catch (error: any) {
      toast.error(error.error || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          New Wholesale Listing
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Add a new manufacturer-grade product to your wholesale catalogue.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                  Product Name
                </label>
                <input
                  {...form.register("name")}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-bold border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white"
                  placeholder="e.g. Dangote Cement 3X - 50kg"
                />
                {form.formState.errors.name && (
                  <p className="mt-1.5 text-xs text-red-500 font-bold">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                    Category
                  </label>
                  <input
                    {...form.register("category")}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-bold border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white"
                    placeholder="e.g. Building Materials"
                  />
                  {form.formState.errors.category && (
                    <p className="mt-1.5 text-xs text-red-500 font-bold">
                      {form.formState.errors.category.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                    Unit of Measure
                  </label>
                  <input
                    {...form.register("unit")}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-bold border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white"
                    placeholder="e.g. Bag, Ton, Pallet"
                  />
                  {form.formState.errors.unit && (
                    <p className="mt-1.5 text-xs text-red-500 font-bold">
                      {form.formState.errors.unit.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                    Wholesale Price (Kobo)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      ₦
                    </span>
                    <input
                      type="number"
                      {...form.register("wholesalePriceKobo")}
                      className="w-full p-3 pl-8 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-bold border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 font-medium">
                    Enter amount in Kobo (e.g. 10000 for ₦100.00)
                  </p>
                  {form.formState.errors.wholesalePriceKobo && (
                    <p className="mt-1.5 text-xs text-red-500 font-bold">
                      {form.formState.errors.wholesalePriceKobo.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                    Minimum Order Qty (MOQ)
                  </label>
                  <input
                    type="number"
                    {...form.register("minOrderQty")}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-bold border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white"
                    placeholder="1"
                  />
                  {form.formState.errors.minOrderQty && (
                    <p className="mt-1.5 text-xs text-red-500 font-bold">
                      {form.formState.errors.minOrderQty.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => router.back()}
            className="px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-lg">check</span>
            )}
            List Product
          </button>
        </div>
      </form>
    </div>
  );
}
