"use client";

import React, { useState, useEffect } from "react";
import { merchantApi } from "@/lib/api/merchant.api";
import { MerchantProfile, VerificationTier } from "@twizrr/shared";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function MerchantDiscovery() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<MerchantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    async function fetchMerchants() {
      try {
        const data = await merchantApi.getMerchants();
        setMerchants(data);
      } catch (err) {
        toast.error("Failed to load merchants");
      } finally {
        setLoading(false);
      }
    }
    fetchMerchants();
  }, []);

  const categories = ["All", "Consumer", "Electronics", "Fashion", "Home", "Health"];

  const filteredMerchants = merchants.filter(m => {
    const matchesSearch = m.businessName?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || m.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Searching verified network...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 px-2 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Explore Merchants</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-bold uppercase tracking-wider">Browse verified merchants in the twizrr network</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text"
              placeholder="Search by business name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border",
                  activeCategory === cat 
                    ? "bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-900 dark:border-slate-200" 
                    : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-white/5 hover:border-slate-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMerchants.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">storefront</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No merchants found matching your search</p>
          </div>
        ) : (
          filteredMerchants.map(merchant => (
            <div 
              key={merchant.id}
              onClick={() => router.push(`/buyer/merchants/${merchant.id}`)}
              className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden p-6"
            >
              <div className="flex items-start gap-5">
                <div className="size-20 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden border border-slate-100 dark:border-white/5 shrink-0 relative">
                  {merchant.profileImage ? (
                    <img src={merchant.profileImage} className="w-full h-full object-cover" alt={merchant.businessName} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-200 dark:text-slate-700 text-3xl">storefront</span>
                    </div>
                  )}
                  {(merchant.verificationTier === VerificationTier.TIER_2 || merchant.verificationTier === VerificationTier.TIER_3) && (
                     <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm">
                        <span className="material-symbols-outlined text-emerald-500 text-lg font-variation-fill">verified</span>
                     </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                      {merchant.businessName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {merchant.category || "General Merchant"}
                    </span>
                    <span className="size-1 rounded-full bg-slate-200" />
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                      Verified Seller
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-amber-500 font-variation-fill">star</span>
                      <span className="text-slate-600 dark:text-slate-300">{merchant.averageRating || "5.0"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">star</span>
                      <span className="text-slate-600 dark:text-slate-300">{merchant.followersCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                <div className="flex -space-x-2">
                   {/* Preview of items or just a clean CTA */}
                   {[1,2,3].map(i => (
                     <div key={i} className="size-8 rounded-lg border-2 border-white dark:border-slate-900 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[10px] text-slate-300">inventory_2</span>
                     </div>
                   ))}
                </div>
                <button className="text-[10px] font-bold text-primary uppercase tracking-widest group-hover:underline">
                  View Storefront
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
