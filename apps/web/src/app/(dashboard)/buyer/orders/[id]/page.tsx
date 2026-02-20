'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatKobo } from '@hardware-os/shared';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function BuyerOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Mock data for high-fidelity demonstration
  const order = {
    id: id as string,
    status: 'SHIPPED',
    merchant: 'Mainland Tools & Co.',
    date: 'Oct 24, 2023',
    total: 2450000n,
    paymentStatus: 'PAID',
    paymentMethod: 'Paystack (Visa)',
    shippingAddress: 'Plot 15, Admiralty Way, Lekki Phase 1, Lagos',
    otp: '881-209',
    items: [
      { id: 1, name: 'Bosch GBH 2-28 F Rotary Hammer', qty: 5, price: 185000n },
      { id: 2, name: 'Premium Type 2 Safety Helmets', qty: 20, price: 15000n },
      { id: 3, name: 'Steel Reinforcement Bars (16mm)', qty: 100, price: 12000n },
    ],
    timeline: [
      { status: 'Order Placed', time: 'Oct 24, 09:12 AM', completed: true },
      { status: 'Payment Confirmed', time: 'Oct 24, 09:15 AM', completed: true },
      { status: 'Dispatch Ready', time: 'Oct 25, 02:30 PM', completed: true },
      { status: 'In Transit', time: 'Oct 26, 10:00 AM', completed: true, active: true },
      { status: 'Delivered', time: 'Estimated: Oct 26, 04:00 PM', completed: false },
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
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-12 w-32 rounded-xl" />
            <Skeleton className="h-12 w-48 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <Skeleton className="h-96 w-full rounded-[2.5rem]" />
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
          <p className="text-slate-500 font-bold text-sm tracking-wide ml-14">Merchant: {order.merchant} • {order.date}</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <StatusBadge status={order.status} className="px-6 py-3 text-[10px] tracking-[0.2em]" />
          <button className="flex items-center gap-2 px-8 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-dark/20 hover:scale-105 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-lg">download</span>
            Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Order Summary</h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.items.length} Items</span>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {order.items.map((item) => (
                <div key={item.id} className="p-8 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                      <div className="size-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-3xl text-slate-300">hardware</span>
                      </div>
                      <div>
                        <h4 className="font-black text-navy-dark dark:text-white text-base uppercase tracking-tight">{item.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Qty: {item.qty} × {formatKobo(item.price)}</p>
                      </div>
                    </div>
                    <p className="font-black text-navy-dark dark:text-white text-lg tracking-tight uppercase leading-none">{formatKobo(BigInt(item.qty) * item.price)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-10 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-10">
              <div className="flex-1 space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</p>
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-sm font-black text-navy-dark dark:text-white uppercase">{order.paymentStatus} via {order.paymentMethod}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-center sm:items-end">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-center sm:text-right">Total Amount (Incl. VAT)</p>
                <p className="text-4xl font-black text-navy-dark dark:text-white tracking-tighter uppercase leading-none">{formatKobo(order.total)}</p>
              </div>
            </div>
          </div>

          {/* Delivery OTP Section */}
          <div className="bg-navy-dark rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-navy-dark/20">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-4 text-center md:text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Security Verification</p>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-tight max-w-sm">Provide this OTP to the rider upon delivery.</h3>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] text-center min-w-[240px]">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Delivery OTP</p>
                <p className="text-5xl font-black tracking-widest">{order.otp}</p>
              </div>
            </div>
            <span className="material-symbols-outlined absolute -right-10 -bottom-10 text-[15rem] text-white/5 opacity-20 rotate-12 group-hover:scale-125 transition-transform duration-[4s]">verified_user</span>
          </div>
        </div>

        {/* Right Column: Tracking & Logistics */}
        <div className="lg:col-span-4 space-y-10">
          {/* Tracking Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-10">
              <span className="material-symbols-outlined text-navy-dark dark:text-white font-black">local_shipping</span>
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Live Tracking</h3>
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

          {/* Delivery Address */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400 font-black">location_on</span>
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Shipping Destination</h3>
            </div>
            <p className="text-[11px] font-black text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-widest">
              {order.shippingAddress}
            </p>
            <button className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-navy-dark transition-all active:scale-95 shadow-sm">
              Change Address
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
