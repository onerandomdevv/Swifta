"use client";

import React from "react";
import Link from "next/link";
import { type MerchantProfile } from "@hardware-os/shared";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { StarRating } from "@/components/ui/star-rating";

interface Props {
  merchants: MerchantProfile[];
  loading?: boolean;
}

export function MerchantSpotlightCarousel({ merchants, loading }: Props) {
  // Sort by averageRating descending and take the top 8
  const topMerchants = [...merchants]
    .filter((m) => m.averageRating && m.averageRating > 0)
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 8);

  // If no rated merchants exist, show all sorted by reviewCount
  const displayMerchants =
    topMerchants.length > 0
      ? topMerchants
      : [...merchants]
          .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
          .slice(0, 8);

  if (displayMerchants.length === 0 && !loading) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
          Top Merchants This Week
        </h2>
        <Link
          href="/buyer/merchants"
          className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline underline-offset-4"
        >
          See All
        </Link>
      </div>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[180px] sm:w-[200px] h-[100px] sm:h-[110px] bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"
              />
            ))
          : displayMerchants.map((m) => (
              <Link
                key={m.id}
                href={`/buyer/merchants/${m.id}`}
                className="shrink-0 w-[180px] sm:w-[200px] bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 sm:p-4 hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  {/* Avatar */}
                  <div className="size-10 sm:size-11 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 ring-2 ring-slate-200 dark:ring-slate-600 group-hover:ring-primary transition-all">
                    {m.profileImage ? (
                      <img
                        src={m.profileImage}
                        alt={m.businessName}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400 text-lg">
                          storefront
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white truncate leading-tight">
                        {m.businessName}
                      </span>
                      <div className="shrink-0 scale-75 origin-left">
                        <VerificationBadge
                          tier={m.verificationTier as any}
                        />
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-amber-500 text-[10px]">⭐</span>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {(m.averageRating || 0).toFixed(1)}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        ({m.reviewCount || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verified tag */}
                {m.verificationTier !== "UNVERIFIED" && (
                  <div className="mt-2.5 flex items-center gap-1 text-[9px] font-bold text-primary uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[12px]">
                      verified
                    </span>
                    Verified Merchant
                  </div>
                )}
              </Link>
            ))}
      </div>
    </section>
  );
}
