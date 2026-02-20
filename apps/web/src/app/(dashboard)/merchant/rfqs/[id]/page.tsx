"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatKobo, nairaToKobo } from "@hardware-os/shared";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function MerchantRFQDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidAmount, setBidAmount] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const rfq = {
    id,
    buyer: "Dangote Construction",
    project: "Lekki Phase 2 Site",
    date: "Oct 24",
    status: "OPEN",
    items: [
      { name: "Elephant Cement (50kg)", qty: 500, estPrice: 7000n },
      { name: "Steel Rods 12mm", qty: 100, estPrice: 12000n },
    ],
  };

  const handleQuote = async () => {
    if (!bidAmount) return;

    setIsSubmitting(true);

    // Strict Compliance: Convert Naira input to Kobo before API call
    const bidInKobo = nairaToKobo(parseFloat(bidAmount));

    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/merchant/rfqs");
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            <Skeleton className="h-96 w-full rounded-[2.5rem]" />
          </div>
          <div className="lg:col-span-5 space-y-8">
            <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
          </div>
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
            Contract Tender
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
            Buyer: {rfq.buyer} • Project: {rfq.project}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50 dark:border-slate-800">
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
                Material List
              </h3>
              <StatusBadge status={rfq.status} />
            </div>

            <div className="space-y-8">
              {rfq.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-tight">
                      {item.name}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      Requested Qty: {item.qty} units
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Buyer Estimate
                    </p>
                    <p className="text-sm font-black text-navy-dark dark:text-white tabular-nums">
                      {formatKobo(item.estPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10">
            <div className="flex items-center gap-4 mb-4">
              <span className="material-symbols-outlined text-blue-500 font-black">
                info
              </span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                Quote Expiration Notice
              </p>
            </div>
            <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
              Quotes submitted on Hardware OS are binding for 48 hours. Ensure
              your logistics capacity is verified before finalizing your bid.
              Settlement occurs via escrow upon delivery confirmation.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm sticky top-10">
            <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-10 pb-4 border-b border-slate-50 dark:border-slate-800">
              Submit Your Quote
            </h3>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Total Settlement (₦)
                </label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-navy-dark dark:text-white">
                    ₦
                  </span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 pl-12 pr-6 text-xl font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Estimated Delivery
                </label>
                <select className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-[11px] font-black uppercase tracking-widest text-navy-dark dark:text-white outline-none appearance-none">
                  <option>Next Day Delivery</option>
                  <option>2-3 Business Days</option>
                  <option>Same Day (Express)</option>
                </select>
              </div>

              <button
                onClick={handleQuote}
                disabled={isSubmitting}
                className="w-full py-5 bg-navy-dark text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-80"
              >
                {isSubmitting ? "Bidding..." : "Submit Official Bid"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
