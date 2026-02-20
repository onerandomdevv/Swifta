'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatKobo } from '@hardware-os/shared';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function BuyerRFQDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const rfq = {
    id,
    title: 'Q4 Facility Expansion',
    status: 'OPEN',
    date: 'Oct 24, 2023',
    items: [
      { name: 'Elephant Cement (50kg)', qty: 500, estPrice: 7000n },
      { name: 'Steel Rods 12mm', qty: 100, estPrice: 12000n },
    ],
    quotes: [
      { id: 'QT-001', merchant: 'Lekki Hardware Ltd', price: 4650000n, delivery: '2 Days', rating: 4.8 },
      { id: 'QT-002', merchant: 'Ikeja Tools & Co', price: 4500000n, delivery: 'Next Day', rating: 4.5 },
    ]
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
            <Skeleton className="h-[500px] w-full rounded-[2.5rem]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-6">
        <button onClick={() => router.back()} className="size-12 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">{rfq.title}</h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">RFQ Reference: {rfq.id} • Submitted {rfq.date}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-10">
          {/* Item Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
            <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-8 pb-4 border-b border-slate-50 dark:border-slate-800">Material Requirements</h3>
            <div className="space-y-8">
              {rfq.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center group">
                  <div className="flex items-center gap-5">
                    <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                      <span className="material-symbols-outlined text-slate-300">category</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-tight">{item.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Quantity: {item.qty} units</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Unit Price</p>
                    <p className="text-sm font-black text-navy-dark dark:text-white">{formatKobo(item.estPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-[2.5rem] p-10 border border-dashed border-slate-200 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Request Lifecycle</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="size-2 rounded-full bg-blue-500 mt-1"></div>
                <div>
                  <p className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-tight">RFQ Broadcasted</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Oct 24, 09:00 AM</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="size-2 rounded-full bg-slate-300 mt-1"></div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-tight">Pending Merchant Quoting</p>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Awaiting more responses</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm sticky top-10">
            <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-50 dark:border-slate-800">
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Received Quotes</h3>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">{rfq.quotes.length} Responses</span>
            </div>

            <div className="space-y-6">
              {rfq.quotes.map((quote) => (
                <div key={quote.id} className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-navy-dark dark:hover:border-white transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-tight">{quote.merchant}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-amber-400 text-xs fill-amber-400">star</span>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{quote.rating} Rating</p>
                      </div>
                    </div>
                    <p className="text-lg font-black text-navy-dark dark:text-white tabular-nums">{formatKobo(quote.price)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Delivery: {quote.delivery}</p>
                    <button className="px-4 py-2 bg-navy-dark text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Accept Quote</button>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-10 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60 leading-relaxed">
              Accepting a quote will automatically generate a purchase order and initiate the escrow process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
