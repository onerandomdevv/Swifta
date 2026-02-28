"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/button";

interface AdminProduct {
  id: string;
  name: string;
  categoryTag: string;
  unit: string;
  minOrderQuantity: number;
  isActive: boolean;
  createdAt: string;
  merchant: {
    businessName: string;
  };
}

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(
    null,
  );

  const { data: products, isLoading } = useQuery<AdminProduct[]>({
    queryKey: ["admin", "products", "all"],
    queryFn: () => apiClient.get("/admin/products"),
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: string) =>
      apiClient.delete(`/admin/products/${productId}`),
    onSuccess: () => {
      toast.success("Product successfully removed from the global catalogue.");
      queryClient.invalidateQueries({ queryKey: ["admin", "products", "all"] });
      setProductToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to scrub product from catalogue.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-neon-cyan">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in mt-4 fade-in slide-in-from-bottom-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-navy-dark dark:text-white uppercase tracking-widest">
            Catalogue Integrity
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">
            Audit and moderate merchant product listings globally
          </p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 rounded-xl text-sm border-2 border-slate-200 dark:border-slate-700">
          <span className="mr-2">Global Items:</span>
          {products?.length || 0}
        </div>
      </header>

      {/* Main Table View */}
      <section className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden">
        {products && products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-100 dark:border-slate-800">
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Product Listing
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Merchant Source
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Visibility
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Created
                  </th>
                  <th className="p-4 md:p-6 text-right text-xs font-black uppercase tracking-widest text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
                  >
                    <td className="p-4 md:p-6">
                      <p className="font-bold text-navy-dark dark:text-white line-clamp-1">
                        {product.name}
                      </p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                        Cat: {product.categoryTag} • Unit: {product.unit}
                      </p>
                    </td>
                    <td className="p-4 md:p-6">
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                        {product.merchant?.businessName || "Unknown Merchant"}
                      </p>
                    </td>
                    <td className="p-4 md:p-6">
                      {product.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-md text-[10px] font-black uppercase tracking-widest">
                          <span className="material-symbols-outlined text-[14px]">
                            public
                          </span>{" "}
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-md text-[10px] font-black uppercase tracking-widest">
                          <span className="material-symbols-outlined text-[14px]">
                            block
                          </span>{" "}
                          Delisted
                        </span>
                      )}
                    </td>
                    <td className="p-4 md:p-6">
                      <p className="text-xs font-bold text-slate-500 font-mono tracking-wider">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4 md:p-6 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 font-bold tracking-wider uppercase text-xs"
                        onClick={() => setProductToDelete(product)}
                        disabled={!product.isActive}
                      >
                        {product.isActive ? "Scrub Item" : "Removed"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4">
              check_circle
            </span>
            <p className="text-lg font-bold text-navy-dark dark:text-white">
              Catalogue is empty
            </p>
            <p className="text-sm font-medium text-slate-500 mt-2">
              No products have been listed by any merchant.
            </p>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8">
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600">
                    <span className="material-symbols-outlined font-bold">
                      delete_forever
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-widest">
                      Confirm Deletion
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setProductToDelete(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Are you entirely sure you want to forcibly delist{" "}
                <span className="font-bold text-navy-dark dark:text-white">
                  "{productToDelete.name}"
                </span>
                ? This will remove it from the public catalogue instantly.
              </p>

              <div className="flex flex-col md:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-xs font-black tracking-widest uppercase border-slate-200"
                  onClick={() => setProductToDelete(null)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 h-12 text-xs font-black tracking-widest uppercase shadow-lg shadow-red-500/20"
                  onClick={() => deleteMutation.mutate(productToDelete.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Scrubbing..." : "Yes, Remove"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
