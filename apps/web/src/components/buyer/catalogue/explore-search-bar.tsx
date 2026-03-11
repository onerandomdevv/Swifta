"use client";

import React from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export function ExploreSearchBar({ value, onChange }: Props) {
  return (
    <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        {/* Title */}
        <h1 className="hidden sm:block text-lg font-black text-slate-900 dark:text-white tracking-tight shrink-0">
          Explore
        </h1>

        {/* Search Input */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-11 sm:h-12 pl-11 pr-12 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-slate-400"
            placeholder="Search products, merchants, categories..."
          />
          {/* Camera icon for future AI image search */}
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
            title="Search by image (coming soon)"
          >
            <span className="material-symbols-outlined text-lg">
              photo_camera
            </span>
          </button>
        </div>

        {/* Notification bell */}
        <button className="shrink-0 size-10 sm:size-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-primary transition-colors">
          <span className="material-symbols-outlined text-slate-500 text-lg">
            notifications
          </span>
        </button>
      </div>
    </div>
  );
}
