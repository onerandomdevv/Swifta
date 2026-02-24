"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 bg-slate-50 dark:bg-slate-900">
          <div className="size-20 rounded-full bg-red-50 dark:bg-red-900/20 border-8 border-red-100 dark:border-red-900/30 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-red-500">
              warning
            </span>
          </div>
          <h1 className="text-3xl font-black text-navy-dark dark:text-white mb-4">
            Something went wrong!
          </h1>
          <p className="text-sm font-bold text-slate-500 max-w-md mb-8">
            A critical error occurred while rendering this page. We've been notified and are looking into it.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-navy-dark dark:hover:text-white transition-colors"
            >
              Go to Homepage
            </button>
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-navy-dark text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-navy-dark/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
