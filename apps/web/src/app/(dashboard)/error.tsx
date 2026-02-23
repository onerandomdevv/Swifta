"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error Caught:", error);
  }, [error]);

  return (
    <div className="min-min-h-[60vh] flex flex-col items-center justify-center p-10 text-center animate-in zoom-in duration-300">
      <div className="p-8 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/30 rounded-[2.5rem] shadow-xl shadow-red-500/5 max-w-md w-full">
        <div className="size-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-3xl text-red-500">
            error
          </span>
        </div>
        <h2 className="text-xl font-black text-navy-dark dark:text-white mb-3">
          Dashboard View Error
        </h2>
        <p className="text-xs font-bold text-slate-500 mb-8 leading-relaxed">
          {error.message || "An unexpected error occurred while loading this section of the dashboard."}
        </p>
        <button
          onClick={() => reset()}
          className="w-full px-6 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        >
          Recover and Try Again
        </button>
      </div>
    </div>
  );
}
