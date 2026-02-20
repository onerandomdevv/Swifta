'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatKobo } from '@hardware-os/shared';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function MerchantRFQsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const rfqs = [
    { id: 'RFQ-001', buyer: 'Dangote Construction', project: 'Lekki Phase 2 Site', items: 5, date: 'Oct 24', status: 'OPEN', priority: 'HIGH' },
    { id: 'RFQ-002', buyer: 'Julius Berger', project: 'Terminal 5 Expansion', items: 12, date: 'Oct 23', status: 'QUOTED', priority: 'MEDIUM' },
    { id: 'RFQ-003', buyer: 'Benson & Sons', project: 'Private Estate', items: 2, date: 'Oct 22', status: 'QUOTED', priority: 'LOW' },
  ];

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96" />
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
      <div className="space-y-1">
        <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Contract Opportunities</h1>
        <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Browse and bid on active material requests from verified buyers</p>
      </div>

      <div className="space-y-6">
        {rfqs.map((rfq) => (
          <div key={rfq.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 hover:shadow-xl transition-all duration-300 group">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-slate-300">gavel</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-tight">{rfq.buyer}</h3>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${rfq.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{rfq.priority} PRIORITY</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rfq.id} • {rfq.items} Line Items • Site: {rfq.project}</p>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right flex flex-col items-center lg:items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <StatusBadge status={rfq.status} className="px-4 py-2 text-[10px]" />
                </div>
                <div className="flex items-center gap-4">
                  <Link href={`/merchant/rfqs/${rfq.id}`} className="px-8 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-navy-dark/10">
                    Quote Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rfqs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-sm">
          <div className="size-24 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <span className="material-symbols-outlined text-4xl text-slate-200">work_history</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">No Active Tenders</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opportunities will appear here when buyers request your stocked catalog.</p>
          </div>
        </div>
      )}
    </div>
  );
}
