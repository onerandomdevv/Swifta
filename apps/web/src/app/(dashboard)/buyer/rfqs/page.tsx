"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyRFQs } from "@/lib/api/rfq.api";
import type { RFQ } from "@hardware-os/shared";

export default function BuyerRFQsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);

  useEffect(() => {
    async function fetchRFQs() {
      try {
        const response = await getMyRFQs();
        setRfqs(response);
      } catch (err: any) {
        setError(err?.message || "Failed to load RFQs");
      } finally {
        setLoading(false);
      }
    }
    fetchRFQs();
  }, []);

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-[2.5rem]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <span className="material-symbols-outlined text-5xl text-red-400">
          error
        </span>
        <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
            Procurement RFQs
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
            Manage your material requests and supplier quotes
          </p>
        </div>
        <Link
          href="/buyer/catalogue"
          className="flex items-center gap-2 px-8 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-dark/20 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add_box</span>
          New Material RFQ
        </Link>
      </div>

      {rfqs.length > 0 ? (
        <div className="space-y-6">
          {rfqs.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                  <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl text-slate-300">
                      description
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-tight">
                        RFQ {rfq.id.slice(0, 8)}
                      </h3>
                      <StatusBadge
                        status={rfq.status}
                        className="px-3 py-1 text-[8px]"
                      />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Qty: {rfq.quantity} &bull;{" "}
                      {new Date(rfq.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                  <div className="text-right flex flex-col items-center md:items-end">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Expires
                    </p>
                    <p className="text-sm font-black text-navy-dark dark:text-white">
                      {new Date(rfq.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/buyer/rfqs/${rfq.id}`}
                    className="size-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-navy-dark dark:text-white hover:border-navy-dark active:scale-95 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-sm">
          <div className="size-24 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <span className="material-symbols-outlined text-4xl text-slate-200">
              contract
            </span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
              No Active Requests
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Start a new request to receive quotes from our verified suppliers.
            </p>
          </div>
          <Link
            href="/buyer/catalogue"
            className="px-8 py-4 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-dark/10 transition-all hover:scale-105 active:scale-95"
          >
            Create First RFQ
          </Link>
        </div>
      )}
    </div>
  );
}
