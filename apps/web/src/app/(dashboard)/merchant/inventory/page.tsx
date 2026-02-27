"use client";

import React, { useState } from "react";
import { useMerchantInventory } from "@/hooks/use-merchant-data";
import { InventoryRow } from "@/components/merchant/inventory/inventory-row";
import { useRouter } from "next/navigation";

export default function MerchantInventory() {
  const router = useRouter();

  const { products, isLoading, isError, error } = useMerchantInventory();

  const [activeTab, setActiveTab] = useState<
    "ALL" | "LOW" | "OUT" | "ACTIVE" | "PAUSED"
  >("ALL");

  if (isLoading) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400 mb-4">
          error
        </span>
        <p className="text-red-500 font-bold">
          {error || "Failed to load inventory"}
        </p>
      </div>
    );
  }

  // Calculate generic stats wired to real data
  const totalSkus = products.length || 0;

  // Use the same logic as InventoryRow for determining what is active/paused/low/out
  const activeStatus = products.filter((p) => p.isActive).length;

  const lowStock = products.filter((p) => {
    const stock = p.stockCache?.stock || 0;
    const threshold = p.minOrderQuantity > 0 ? p.minOrderQuantity * 2 : 10;
    return p.isActive && stock > 0 && stock <= threshold;
  }).length;

  // Filter logic for tabs based on activeTab state
  const filteredProducts = products.filter((p) => {
    const stock = p.stockCache?.stock || 0;
    const threshold = p.minOrderQuantity > 0 ? p.minOrderQuantity * 2 : 10;

    switch (activeTab) {
      case "ACTIVE":
        return p.isActive && stock > 0;
      case "PAUSED":
        return !p.isActive;
      case "OUT":
        return stock === 0;
      case "LOW":
        return p.isActive && stock > 0 && stock <= threshold;
      case "ALL":
      default:
        return true;
    }
  });

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Area - Action Button */}
      <div className="p-8 pb-4 flex justify-end shrink-0">
        <button
          onClick={() => router.push("/merchant/inventory/new")}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add New Product
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 px-8 pb-0 shrink-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Total SKUs
          </p>
          <p className="text-2xl font-bold mt-1">{totalSkus}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Active Status
          </p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {activeStatus}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Low Stock
          </p>
          <p className="text-2xl font-bold mt-1 text-amber-500">{lowStock}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Warehouse Capacity
          </p>
          <p className="text-2xl font-bold mt-1 text-primary">--%</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-8 mt-6 shrink-0">
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
          {(["ALL", "LOW", "OUT", "ACTIVE", "PAUSED"] as const).map((tab) => {
            const labels = {
              ALL: "All Stock",
              LOW: "Low Stock",
              OUT: "Out of Stock",
              ACTIVE: "Active",
              PAUSED: "Paused",
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Table Section */}
      <div className="flex-1 p-8 pt-4 overflow-hidden flex flex-col">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Product Description
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Warehouse Location
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Unit of Measure
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Market Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <InventoryRow
                    key={product.id}
                    product={product}
                    onQuickEdit={(id) =>
                      router.push(`/merchant/products/${id}/edit`)
                    }
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
                      inventory_2
                    </span>
                    <p className="text-sm">
                      No products found for this filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="p-4 mt-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0">
          <p className="text-xs font-medium text-slate-500">
            Showing {filteredProducts.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 disabled:opacity-50"
              disabled
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>
            <button className="size-8 rounded bg-primary text-white text-xs font-bold">
              1
            </button>
            <button
              className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 disabled:opacity-50"
              disabled
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
