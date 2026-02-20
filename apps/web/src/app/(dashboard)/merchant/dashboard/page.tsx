'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatKobo } from '@hardware-os/shared';

export default function MerchantDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { label: 'Pipeline Value', value: 12450000n, trend: '+12% this month', trendType: 'up', icon: 'account_balance_wallet', sub: 'Calculated from 48 active quotes' },
    { label: 'Active RFQs', value: '32', trend: '+5 new today', trendType: 'up', icon: 'description', sub: 'Requires immediate response' },
    { label: 'Incomplete Orders', value: '14', badge: '8 URGENT', icon: 'inventory_2', sub: 'Awaiting dispatch verification' },
    { label: 'Sales Velocity', value: '4.8/5', trend: 'Top 5% in Lagos', trendType: 'up', icon: 'speed', sub: 'Avg response time: 42 mins' },
  ];

  const recentRFQs = [
    { id: 'RFQ-2024-001', buyer: 'Dangote Construction', items: '500 Bags of Cement', value: 3500000n, time: '12 mins ago', status: 'NEW' },
    { id: 'RFQ-2024-002', buyer: 'Lagos State Govt', items: 'Iron Rods (16mm)', value: 12000000n, time: '1 hour ago', status: 'NEW' },
    { id: 'RFQ-2024-003', buyer: 'Julius Berger', items: 'Industrial Drill Bits', value: 850000n, time: '3 hours ago', status: 'QUOTED' },
  ];

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-96 rounded-xl" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-56 w-full rounded-[2.5rem]" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 space-y-8">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-96 w-full rounded-[2.5rem]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Merchant Dashboard</h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Enterprise Trading Hub • Mainland Tools & Co.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:border-navy-dark active:scale-95 shadow-sm">
            <span className="material-symbols-outlined text-lg font-black">download</span>
            Export Reports
          </button>
          <Link href="/merchant/products/new" className="flex items-center gap-2 px-8 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-dark/20 transition-all active:scale-95">
            <span className="material-symbols-outlined text-lg">add_box</span>
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <span className="material-symbols-outlined font-black">{stat.icon}</span>
              </div>
              {stat.trend && (
                <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${stat.trendType === 'up' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                  {stat.trend}
                </span>
              )}
              {stat.badge && (
                <span className="px-3 py-1 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest border border-red-100 rounded-full animate-pulse">
                  {stat.badge}
                </span>
              )}
            </div>

            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 relative z-10">{stat.label}</p>
            <h3 className="text-3xl font-black text-navy-dark dark:text-white tracking-tighter uppercase leading-none relative z-10">
              {typeof stat.value === 'bigint' ? formatKobo(stat.value) : stat.value}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6 relative z-10">{stat.sub}</p>

            <div className="absolute -right-6 -bottom-6 size-24 bg-slate-50 dark:bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Recent RFQs */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-navy-dark dark:text-white font-black">mail</span>
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Incoming RFQs</h3>
            </div>
            <Link href="/merchant/rfqs" className="text-[10px] font-black text-slate-400 hover:text-navy-dark dark:hover:text-white uppercase tracking-widest transition-colors">View All Requests</Link>
          </div>

          <div className="space-y-4">
            {recentRFQs.map((rfq) => (
              <div key={rfq.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-navy-dark dark:text-white">description</span>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mb-1">
                      <h4 className="font-black text-navy-dark dark:text-white text-base uppercase tracking-tight">{rfq.buyer}</h4>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest ${rfq.status === 'NEW' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {rfq.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">{rfq.items} • Expected Value: {formatKobo(rfq.value)}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{rfq.time}</p>
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Lagos, NG</p>
                    </div>
                    <Link href={`/merchant/rfqs/${rfq.id}`} className="size-12 rounded-2xl bg-navy-dark text-white flex items-center justify-center shadow-lg shadow-navy-dark/10 hover:bg-slate-800 transition-all active:scale-95">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Mini Analytics / Inventory Alert */}
        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-navy-dark dark:text-white font-black">warehouse</span>
            <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Inventory Health</h3>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Power Tools</p>
                  <p className="text-[11px] font-black text-navy-dark dark:text-white uppercase">85% In Stock</p>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[85%]"></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Safety Gear</p>
                  <p className="text-[11px] font-black text-orange-500 uppercase">22% — Restock soon</p>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 w-[22%]"></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulk Materials</p>
                  <p className="text-[11px] font-black text-navy-dark dark:text-white uppercase">64% In Stock</p>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[64%]"></div>
                </div>
              </div>
            </div>

            <Link href="/merchant/inventory" className="w-full mt-12 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-navy-dark dark:text-white transition-all hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-3">
              Manage Inventory
            </Link>
          </div>

          <div className="bg-gradient-to-br from-navy-dark to-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Trading Tip</p>
              <h4 className="text-xl font-black leading-tight uppercase">Update your stock levels daily to rank higher in buyer searches.</h4>
              <button className="text-blue-400 font-black text-[10px] uppercase tracking-widest hover:underline underline-offset-8 decoration-2 mt-4 inline-block">Learn Performance Hacks</button>
            </div>
            <span className="material-symbols-outlined absolute -right-10 -bottom-10 text-[15rem] text-white/5 group-hover:scale-125 transition-transform duration-[2s] rotate-12">lightbulb</span>
          </div>
        </div>
      </div>
    </div>
  );
}
