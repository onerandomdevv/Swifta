'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatKobo } from '@hardware-os/shared';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function BuyerRFQsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const rfqs = [
    { id: 'RFQ-2024-X99', title: 'Q4 Facility Expansion', items: 12, status: 'OPEN', date: 'Oct 24, 2023', estimate: 4500000n },
    { id: 'RFQ-2024-X98', title: 'Site B Electrical Overhaul', items: 8, status: 'QUOTED', date: 'Oct 22, 2023', estimate: 1200000n },
    { id: 'RFQ-2024-X97', title: 'Heavy Machinery Drill Bits', items: 5, status: 'ORDERED', date: 'Oct 20, 2023', estimate: 850000n },
  ];

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
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-[2.5rem]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Procurement RFQs</h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Manage your material requests and supplier quotes</p>
        </div>
        <Link href="/buyer/catalogue" className="flex items-center gap-2 px-8 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-dark/20 hover:scale-105 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-lg">add_box</span>
          New Material RFQ
        </Link>
      </div>

      <div className="space-y-6">
        {rfqs.map((rfq) => (
          <div key={rfq.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 hover:shadow-xl transition-all duration-300 group">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-slate-300">description</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-tight">{rfq.title}</h3>
                    <StatusBadge status={rfq.status} className="px-3 py-1 text-[8px]" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rfq.id} • {rfq.items} Unique Materials • {rfq.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right flex flex-col items-center md:items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Value</p>
                  <p className="text-2xl font-black text-navy-dark dark:text-white tabular-nums">{formatKobo(rfq.estimate)}</p>
                </div>
                <Link href={`/buyer/rfqs/${rfq.id}`} className="size-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-navy-dark dark:text-white hover:border-navy-dark active:scale-95 transition-all shadow-sm">
                  <span className="material-symbols-outlined">chevron_right</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rfqs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-sm">
          <div className="size-24 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <span className="material-symbols-outlined text-4xl text-slate-200">contract</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">No Active Requests</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start a new request to receive quotes from our verified suppliers.</p>
          </div>
          <Link href="/buyer/catalogue" className="px-8 py-4 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-dark/10 transition-all hover:scale-105 active:scale-95">
            Create First RFQ
          </Link>
        </div>
      )}
    </div>
  );
}
