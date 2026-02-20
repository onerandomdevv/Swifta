'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatKobo } from '@hardware-os/shared';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function MerchantOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Mock data for high-fidelity demonstration
  const order = {
    id: id as string,
    status: 'PAID',
    buyer: 'Dangote Construction Ltd.',
    date: 'Oct 24, 2023',
    total: 3500000n,
    paymentStatus: 'SETTLED',
    deliveryAddress: 'Ibeju-Lekki Construction Site, Block 4, Lagos',
    buyerContact: 'John Doe (+234 803 000 0000)',
    items: [
      { id: 1, name: 'Elephant Cement (50kg)', qty: 500, price: 7000n },
    ],
    timeline: [
      { status: 'RFQ Received', time: 'Oct 23, 04:00 PM', completed: true },
      { status: 'Quote Sent', time: 'Oct 23, 05:15 PM', completed: true },
      { status: 'Order Created', time: 'Oct 24, 09:12 AM', completed: true },
      { status: 'Payment Settled', time: 'Oct 24, 09:45 AM', completed: true, active: true },
    ]
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-12 w-48 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <Skeleton className="h-[500px] w-full rounded-[2.5rem]" />
          </div>
          <div className="lg:col-span-4 space-y-8">
            <Skeleton className="h-80 w-full rounded-[2.5rem]" />
            <Skeleton className="h-64 w-full rounded-[2.5rem]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => router.back()} className="size-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Order #{order.id}</h1>
          </div>
          <p className="text-slate-500 font-bold text-sm tracking-wide ml-14">Buyer: {order.buyer} • {order.date}</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <StatusBadge status={order.status} className="px-6 py-3 text-[10px] tracking-[0.2em]" />
          <button className="flex items-center gap-2 px-8 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-dark/20 hover:scale-105 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-lg">local_shipping</span>
            Ready for Dispatch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Fulfillment Details</h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.items.length} Product Line</span>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {order.items.map((item) => (
                <div key={item.id} className="p-8 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                      <div className="size-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-3xl text-slate-300">layers</span>
                      </div>
                      <div>
                        <h4 className="font-black text-navy-dark dark:text-white text-base uppercase tracking-tight">{item.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Order Volume: {item.qty} Units × {formatKobo(item.price)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-navy-dark dark:text-white text-lg tracking-tight uppercase leading-none">{formatKobo(BigInt(item.qty) * item.price)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-10 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start gap-10">
              <div className="flex-1 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement Info</p>
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-emerald-500"></div>
                  <p className="text-sm font-black text-navy-dark dark:text-white uppercase">Vault Payout: {order.paymentStatus}</p>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed max-w-xs">Funds are held in escrow and will be released upon buyer OTP verification.</p>
              </div>
              <div className="text-right flex flex-col items-center sm:items-end">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-center sm:text-right">Total Order Value</p>
                <p className="text-4xl font-black text-navy-dark dark:text-white tracking-tighter uppercase leading-none">{formatKobo(order.total)}</p>
              </div>
            </div>
          </div>

          {/* Action Call for Merchant */}
          <div className="bg-gradient-to-br from-navy-dark to-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl">
            <div className="relative z-10 space-y-6">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Logistic Action Required</p>
              <h3 className="text-2xl font-black uppercase tracking-tight leading-tight max-w-lg">Please dispatch materials to the specified site and request the Buyer's OTP for payout.</h3>
              <div className="flex gap-4">
                <button className="px-8 py-4 bg-white text-navy-dark rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-xl">Print Waybill</button>
                <button className="px-8 py-4 border-2 border-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">Contact Buyer</button>
              </div>
            </div>
            <span className="material-symbols-outlined absolute -right-10 -bottom-10 text-[18rem] text-white/5 opacity-20 rotate-12 group-hover:scale-125 transition-transform duration-[4s]">dock</span>
          </div>
        </div>

        {/* Right Column: Logistics & Buyer Details */}
        <div className="lg:col-span-4 space-y-10">
          {/* Logistics Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-10">
              <span className="material-symbols-outlined text-navy-dark dark:text-white font-black">history</span>
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Trade History</h3>
            </div>

            <div className="space-y-12 relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>

              {order.timeline.map((step, idx) => (
                <div key={idx} className="relative pl-10">
                  <div className={`absolute left-0 top-1.5 size-4 rounded-full border-2 ${step.completed ? 'bg-navy-dark border-navy-dark' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'} ${step.active ? 'ring-8 ring-navy-dark/5' : ''} z-10 transition-all shadow-sm`}>
                    {step.completed && <div className="size-full flex items-center justify-center"><div className="size-1 rounded-full bg-white"></div></div>}
                  </div>
                  <div>
                    <p className={`text-[11px] font-black uppercase tracking-widest ${step.completed ? 'text-navy-dark dark:text-white' : 'text-slate-400'}`}>
                      {step.status}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tight opacity-60">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buyer Info */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 space-y-8">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Destination</p>
              <p className="text-[11px] font-black text-navy-dark dark:text-white leading-relaxed uppercase tracking-widest">
                {order.deliveryAddress}
              </p>
            </div>
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer Representative</p>
              <p className="text-[11px] font-black text-navy-dark dark:text-white leading-relaxed uppercase tracking-widest">
                {order.buyerContact}
              </p>
            </div>
            <button className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-navy-dark transition-all active:scale-95 shadow-sm">
              View Site Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
