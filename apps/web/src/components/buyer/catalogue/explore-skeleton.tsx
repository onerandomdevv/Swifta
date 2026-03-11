"use client";

import React from "react";

export function ExploreSkeleton() {
  return (
    <div className="animate-pulse space-y-6 sm:space-y-8">
      {/* Search Bar Skeleton */}
      <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />

      {/* Category Stories Skeleton */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0">
            <div className="size-14 sm:size-16 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="h-2 w-10 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Merchant Spotlight Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-[180px] sm:w-[200px] h-[100px] bg-slate-100 dark:bg-slate-800 rounded-2xl"
            />
          ))}
        </div>
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3">
              <div className="size-9 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-2 w-14 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            </div>
            {/* Image */}
            <div className="aspect-square bg-slate-100 dark:bg-slate-800" />
            {/* Footer */}
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-5 w-1/3 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="flex gap-2">
                <div className="flex-1 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                <div className="h-10 w-14 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
