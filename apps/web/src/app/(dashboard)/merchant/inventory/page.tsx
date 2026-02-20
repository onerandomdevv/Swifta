'use client';

import React, { useState, useEffect } from 'react';
import { formatKobo } from '@hardware-os/shared';
import { Skeleton } from '@/components/ui/skeleton';

export default function MerchantInventoryPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const inventory = [
    { id: 'INV-001', name: 'Elephant Cement (50kg)', stock: 5000, status: 'HEALTHY', price: 7000n, location: 'Warehouse A' },
    { id: 'INV-002', name: 'Premium Steel Rods (12mm)', stock: 120, status: 'LOW', price: 12000n, location: 'Warehouse B' },
    { id: 'INV-003', name: 'Electrical Conduit Pipes', stock: 0, status: 'OUT_OF_STOCK', price: 1500n, location: 'Warehouse A' },
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-[2rem]" />)}
        </div>

        <div className="space-y-6">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-40 w-full rounded-[2.5rem]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Inventory Vault</h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Oversee your physical stock levels and warehouse distribution</p>
        </div>
        <button className="flex items-center gap-2 px-8 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-dark/20 hover:scale-105 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-lg">inventory_2</span>
          Update Stock Levels
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm group hover:border-blue-200 transition-colors">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Stock Volume</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-navy-dark dark:text-white tracking-tighter">5,120</h3>
            <span className="material-symbols-outlined text-blue-500 opacity-20 text-4xl group-hover:scale-125 transition-transform font-black">box</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm group hover:border-amber-200 transition-colors">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Low Stock Alerts</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-amber-500 tracking-tighter">12</h3>
            <span className="material-symbols-outlined text-amber-500 opacity-20 text-4xl group-hover:scale-125 transition-transform font-black">warning</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm group hover:border-emerald-200 transition-colors">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Vault Value</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-emerald-500 tracking-tighter tabular-nums truncate">₦84.2M</h3>
            <span className="material-symbols-outlined text-emerald-500 opacity-20 text-4xl group-hover:scale-125 transition-transform font-black">token</span>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="space-y-6">
        {inventory.map((item) => (
          <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 hover:shadow-xl transition-all duration-300 group">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-slate-300">pallet</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-tight">{item.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {item.id} • {item.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:flex items-center gap-10">
                <div className="text-center md:text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Stock</p>
                  <p className={`text-xl font-black tracking-tighter ${item.status === 'OUT_OF_STOCK' ? 'text-red-500' : item.status === 'LOW' ? 'text-amber-500' : 'text-navy-dark dark:text-white'}`}>
                    {item.stock.toLocaleString()} Units
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Price</p>
                  <p className="text-xl font-black text-navy-dark dark:text-white tabular-nums">{formatKobo(item.price)}</p>
                </div>
                <div className="flex items-center gap-4 col-span-2 lg:col-span-1 justify-center">
                  <button className="size-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-navy-dark dark:text-white hover:border-navy-dark active:scale-95 transition-all shadow-sm">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
