"use client";

import React from "react";
import Link from "next/link";
import { type MerchantProfile } from "@swifta/shared";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { StarRating } from "@/components/ui/star-rating";

interface Props {
  merchants: MerchantProfile[];
  loading?: boolean;
}

export function MerchantSpotlightCarousel({ merchants, loading }: Props) {
  // Sort by averageRating descending and take the top 8
  const displayMerchants = [...merchants]
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 8);

  if (displayMerchants.length === 0 && !loading) return null;

  return (
    <section className="space-y-6 font-display">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          Merchant Spotlight
        </h2>
        <Link
          href="/buyer/merchants"
          className="text-sm font-bold text-primary hover:underline underline-offset-4"
        >
          Explore All
        </Link>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 px-2 scroll-smooth no-scrollbar">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-44 h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"
              />
            ))
          : displayMerchants.map((m) => (
              <div
                key={m.id}
                className="shrink-0 w-44 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm text-center flex flex-col group"
              >
                <div className="relative size-16 mx-auto mb-3">
                  <div className="size-full rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 overflow-hidden transition-all group-hover:border-primary">
                    {m.profileImage ? (
                      <img
                        src={m.profileImage}
                        alt={m.businessName}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-300 text-2xl">
                          store
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-[8px] text-white font-bold px-2 py-0.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
                    LIVE
                  </div>
                </div>

                <div className="flex-1 min-w-0 mb-3 mt-1">
                  <h3 className="font-bold text-xs truncate text-slate-900 dark:text-white leading-tight">{m.businessName}</h3>
                </div>

                <Link
                  href={`/buyer/merchants/${m.id}`}
                  className="w-full py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  Visit Store
                </Link>
              </div>
            ))}
      </div>
    </section>
  );
}
