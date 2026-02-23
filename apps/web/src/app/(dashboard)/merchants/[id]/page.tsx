"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicProfile } from "@/lib/api/merchant.api";
import { getPublicProductsByMerchant } from "@/lib/api/product.api";
import type { Product } from "@hardware-os/shared";

export default function MerchantProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, productsRes] = await Promise.all([
          getPublicProfile(id as string),
          getPublicProductsByMerchant(id as string, 1, 50),
        ]);
        
        const profileData = (profileRes as any).data || profileRes;
        const productsData = (productsRes as any).data || productsRes;
        
        setMerchant(profileData);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load merchant profile");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500 max-w-6xl mx-auto">
        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-[2rem]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <span className="material-symbols-outlined text-5xl text-red-500">
          error
        </span>
        <p className="text-sm font-bold text-red-600 uppercase tracking-wide">
          {error || "Merchant not found"}
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isVerified = merchant.verification === "VERIFIED";

  return (
    <div className="space-y-10 py-4 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Merchant Profile Header */}
      <div className="bg-navy-dark rounded-[3rem] p-10 lg:p-14 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-10">
        <span className="material-symbols-outlined absolute -right-20 -bottom-20 text-[300px] text-white/5 pointer-events-none select-none z-0 transform -rotate-12">
          storefront
        </span>
        
        <div className="size-32 lg:size-40 rounded-full bg-white flex items-center justify-center shadow-lg relative z-10 shrink-0">
          <span className="material-symbols-outlined text-6xl text-navy-dark">
            store
          </span>
          {isVerified && (
            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white size-10 rounded-full flex items-center justify-center border-4 border-navy-dark" title="Verified Merchant">
              <span className="material-symbols-outlined text-xl">verified</span>
            </div>
          )}
        </div>

        <div className="relative z-10 flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h1 className="text-4xl lg:text-5xl font-black text-white uppercase font-display tracking-tight">
              {merchant.businessName}
            </h1>
            {isVerified ? (
               <span className="bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap inline-block mx-auto md:mx-0">
                 Verified Trust
               </span>
            ) : (
               <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap inline-block mx-auto md:mx-0">
                 Unverified
               </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-blue-400">location_on</span>
              <span className="text-sm font-bold">{merchant.businessAddress || "Lagos, Nigeria"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-blue-400">calendar_month</span>
              <span className="text-sm font-bold">Joined {new Date(merchant.createdAt).getFullYear()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-blue-400">inventory_2</span>
              <span className="text-sm font-bold">{products.length} Products Listed</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 shrink-0">
          <Link
            href={`/buyer/rfqs/new-custom?merchantId=${merchant.id}`}
            className="flex items-center gap-2 px-8 py-4 bg-white text-navy-dark rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-lg">edit_document</span>
            Custom Request
          </Link>
        </div>
      </div>

      {/* Product Listings */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-navy-dark dark:text-white uppercase font-display tracking-tight">
            Storefront Items
          </h2>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="size-16 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl text-blue-500">
                        inventory_2
                      </span>
                    </div>
                    <span className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {product.categoryTag}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-navy-dark dark:text-white mb-2 leading-tight">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 leading-relaxed">
                      {product.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800 mt-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Min Order
                    </p>
                    <p className="font-black text-navy-dark dark:text-white">
                      {product.minOrderQuantity} {product.unit}
                    </p>
                  </div>
                  <Link
                    href={`/buyer/rfqs/new?productId=${product.id}`}
                    className="flex items-center gap-2 px-5 py-3 bg-navy-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md"
                  >
                    Request
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] py-24 flex flex-col items-center justify-center text-center">
             <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6">
               <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
             </div>
             <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight mb-2">
               No Products Listed
             </h3>
             <p className="text-xs font-bold text-slate-400">
               This merchant hasn't made any products visible in their storefront yet.
             </p>
          </div>
        )}
      </div>

    </div>
  );
}
