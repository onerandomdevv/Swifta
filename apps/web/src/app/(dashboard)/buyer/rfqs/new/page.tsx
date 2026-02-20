"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { nairaToKobo } from "@hardware-os/shared";

export default function CreateRFQPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [budget, setBudget] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Strict Compliance: Convert Naira input to Kobo before API call
    const budgetInKobo = budget ? nairaToKobo(parseFloat(budget)) : 0n;

    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/buyer/rfqs");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 space-y-8">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-6">
        <button
          onClick={() => router.back()}
          className="size-12 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
            New Material RFQ
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
            Broadcast your requirements to verified Lagos merchants
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl shadow-navy-dark/5 space-y-10"
        >
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Project Title
              </label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all"
                placeholder="e.g. Site B Electrical Overhaul"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Material Specifications
              </label>
              <textarea
                required
                className="w-full h-48 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl py-5 px-6 text-sm font-bold text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all resize-none"
                placeholder="List materials, quantities, and specific brand requirements..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Estimated Budget (₦)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Urgency Level
                </label>
                <select className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-[11px] font-black uppercase tracking-widest text-navy-dark dark:text-white outline-none appearance-none">
                  <option>Standard (7.5 Days)</option>
                  <option>Urgent (48 Hours)</option>
                  <option>Emergency (Today)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-12 py-5 bg-navy-dark text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-80 flex items-center gap-3"
            >
              {isSubmitting ? "Processing..." : "Broadcast RFQ"}
              <span className="material-symbols-outlined text-lg">
                rocket_launch
              </span>
            </button>
          </div>
        </form>

        <div className="mt-10 p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2.5rem] border border-dashed border-blue-200 dark:border-blue-900/30 flex items-start gap-6">
          <span className="material-symbols-outlined text-blue-500 font-black">
            gavel
          </span>
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-tight">
            Your RFQ will be sent to our pool of{" "}
            <span className="text-navy-dark dark:text-white font-black">
              200+ verified hardware merchants
            </span>{" "}
            across Lagos. You will receive quotes directly in your dashboard for
            comparison.
          </p>
        </div>
      </div>
    </div>
  );
}
