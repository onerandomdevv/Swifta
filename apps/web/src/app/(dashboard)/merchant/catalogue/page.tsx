"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useMerchantInventory } from "@/hooks/use-merchant-data";
import { StorefrontCard } from "@/components/merchant/storefront/storefront-card";

export default function MerchantStorefrontPreview() {
  const router = useRouter();
  const { user } = useAuth();
  const { products, isLoading, isError, error } = useMerchantInventory();

  // Derive merchant info from first product's merchant relation, or fallback
  const merchantInfo = products[0]?.merchant;
  const businessName = merchantInfo?.businessName || "Your Business";
  const activeProducts = products.filter((p) => p.isActive).length;
  const memberSince = user?.merchantId
    ? new Date().toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "—";

  const handleCopyLink = () => {
    const slug = businessName.toLowerCase().replace(/\s+/g, "-");
    const link = `hardware.os/store/${slug}`;
    navigator.clipboard.writeText(link).then(() => {
      alert("Storefront link copied!");
    });
  };

  if (isLoading) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-4">
            error
          </span>
          <p className="text-red-500 font-bold">
            {error || "Failed to load storefront"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-10 pb-32">
        {/* Industrial Dashed Preview Frame */}
        <div
          className="rounded-3xl p-1 relative bg-slate-100/50 dark:bg-slate-800/30"
          style={{ border: "2px dashed #cbd5e1" }}
        >
          {/* Floating Label */}
          <div className="absolute -top-3 left-10 bg-slate-50 dark:bg-slate-900 px-4 text-[11px] font-black text-slate-400 tracking-[0.2em]">
            STOREFRONT PREVIEW
          </div>

          {/* Inner White Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            {/* ═══════════ Store Profile Header ═══════════ */}
            <div className="p-10 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between">
                <div className="flex gap-8">
                  {/* Store Icon */}
                  <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">
                      storefront
                    </span>
                  </div>

                  {/* Store Details */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {businessName}
                      </h1>
                      <div className="flex items-center gap-1 bg-green-500/10 text-green-600 px-3 py-1 rounded-full">
                        <span className="material-symbols-outlined text-sm">
                          verified
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Verified Merchant
                        </span>
                      </div>
                    </div>

                    {/* Location & Response Time */}
                    <div className="flex items-center gap-6 text-slate-500 mb-6">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-lg">
                          location_on
                        </span>
                        <span className="text-sm font-medium">
                          Lagos, Nigeria
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-lg">
                          schedule
                        </span>
                        <span className="text-sm font-medium">
                          Typical response: &lt; 2 hours
                        </span>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex gap-12">
                      <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {activeProducts}
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          Active Products
                        </div>
                      </div>
                      <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800 self-center"></div>
                      <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {memberSince}
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          Merchant Since
                        </div>
                      </div>
                      <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800 self-center"></div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-bold text-slate-900 dark:text-white">
                            4.8
                          </span>
                          <span className="material-symbols-outlined text-amber-400 text-xl">
                            star
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          Global Rating
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm">
                    Contact Merchant
                  </button>
                  <button className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    Share Profile
                  </button>
                </div>
              </div>
            </div>

            {/* ═══════════ Product Grid ═══════════ */}
            <div className="p-10 bg-slate-50/30 dark:bg-slate-800/10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  Product Inventory
                </h3>
                <div className="flex gap-3">
                  <div className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">
                      filter_list
                    </span>{" "}
                    Category: All
                  </div>
                  <div className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">
                      sort
                    </span>{" "}
                    Sort: Popular
                  </div>
                </div>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {products
                    .filter((p) => p.isActive)
                    .map((product) => (
                      <StorefrontCard key={product.id} product={product} />
                    ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">
                    inventory_2
                  </span>
                  <p className="text-slate-500 font-medium text-sm">
                    No products listed yet.
                  </p>
                  <button
                    onClick={() => router.push("/merchant/inventory/new")}
                    className="mt-4 text-primary font-bold text-xs uppercase tracking-widest hover:underline"
                  >
                    Add Your First Product →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ Sticky Bottom Action Bar ═══════════ */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-8 py-5 flex items-center justify-between shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Storefront URL
          </span>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              hardware.os/store/
              {businessName.toLowerCase().replace(/\s+/g, "-")}
            </span>
            <button
              onClick={handleCopyLink}
              className="text-primary hover:text-primary/80"
            >
              <span className="material-symbols-outlined text-lg">
                content_copy
              </span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleCopyLink}
            className="px-8 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">link</span>
            Copy Storefront Link
          </button>
          <button
            onClick={() => router.push("/merchant/inventory")}
            className="px-8 py-3 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
            Edit Inventory
          </button>
        </div>
      </div>
    </div>
  );
}
