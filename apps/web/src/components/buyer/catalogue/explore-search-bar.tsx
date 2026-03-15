"use client";

import React from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export function ExploreSearchBar({ value, onChange }: Props) {
  return (
    <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-8 py-4 backdrop-blur-sm">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4 sm:gap-8 font-display">
        {/* Search Input Area */}
        <div className="flex-1 relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
            search
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-11 pr-6 focus:ring-1 focus:ring-primary focus:border-primary text-sm font-medium transition-all outline-none"
            placeholder="Search products, machinery, or equipment..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary transition-all">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
          <button className="size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary transition-all">
            <span className="material-symbols-outlined text-xl">chat_bubble</span>
          </button>
        </div>
      </div>
    </div>
  );
}
