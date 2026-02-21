"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getMerchantRFQs } from "@/lib/api/rfq.api";
import type { RFQ } from "@hardware-os/shared";

export default function MerchantRFQsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [activeTab, setActiveTab] = useState<
    "ALL" | "OPEN" | "QUOTED" | "CLOSED"
  >("ALL");

  useEffect(() => {
    async function fetchRFQs() {
      try {
        const payload = (await getMerchantRFQs()) as any;
        const data = Array.isArray(payload) ? payload : payload?.data || [];
        setRfqs(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load RFQs");
      } finally {
        setLoading(false);
      }
    }
    fetchRFQs();
  }, []);

  const filteredRfqs = rfqs.filter((rfq) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "OPEN") return rfq.status === "OPEN";
    if (activeTab === "QUOTED")
      return (
        rfq.status === "QUOTED" ||
        rfq.status === "ACCEPTED" ||
        rfq.status === "DECLINED"
      );
    if (activeTab === "CLOSED")
      return rfq.status === "EXPIRED" || rfq.status === "CANCELLED";
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96" />
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
      <div className="space-y-1">
        <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
          Incoming RFQs
        </h1>
        <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
          Browse and bid on active material requests from verified buyers
        </p>
      </div>

      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto no-scrollbar">
        {(["ALL", "OPEN", "QUOTED", "CLOSED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? "border-navy-dark text-navy-dark dark:border-white dark:text-white" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredRfqs.length > 0 ? (
        <div className="space-y-6">
          {filteredRfqs.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                  <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl text-slate-300">
                      gavel
                    </span>
                  </div>
                  <div className="space-y-2">
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
                  <div className="text-right flex flex-col items-center lg:items-end">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Expires
                    </p>
                    <p className="text-sm font-black text-navy-dark dark:text-white">
                      {new Date(rfq.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/merchant/rfqs/${rfq.id}`}
                      className="px-8 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-navy-dark/10"
                    >
                      Quote Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-sm">
          <div className="size-24 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <span className="material-symbols-outlined text-4xl text-slate-200">
              work_history
            </span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
              No Incoming RFQs
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
              Opportunities will appear here when buyers request your stocked
              catalog.
            </p>
          </div>
          <Link
            href="/merchant/inventory/new"
            className="px-8 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-navy-dark/10"
          >
            Add Products
          </Link>
        </div>
      )}
    </div>
  );
}
