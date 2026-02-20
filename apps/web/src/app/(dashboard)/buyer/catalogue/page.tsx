'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function BuyerCataloguePage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Power Tools', 'Building Materials', 'Electrical', 'Safety Gear', 'Fasteners'];

  const products = [
    {
      id: 'PROD-001',
      name: 'Bosch GBH 2-28 F Professional Rotary Hammer',
      category: 'Power Tools',
      sku: 'BO-ROT-28F',
      shipping: 'Immediate Dispatch',
      statusBadge: 'New',
      image: 'construction'
    },
    {
      id: 'PROD-002',
      name: 'Galvanized Steel Pipe - 2 Inch Schedule 40',
      category: 'Building Materials',
      sku: 'PIPE-G-40-2',
      shipping: 'Lagos Region Only',
      image: 'plumbing'
    },
    {
      id: 'PROD-003',
      name: 'Schneider Electric MCB - 3 Phase 63A',
      category: 'Electrical',
      sku: 'SE-MCB-63-3',
      shipping: 'Bulk Only',
      image: 'electrical_services'
    },
    {
      id: 'PROD-004',
      name: 'Premium Ventilated Safety Helmet - Type 2',
      category: 'Safety Gear',
      sku: 'SF-HELM-T2',
      shipping: 'In Stock (200+ units)',
      image: 'chef_hat'
    },
    {
      id: 'PROD-005',
      name: 'Bulk Wood Screws - 3.5mm x 50mm (Crate)',
      category: 'Fasteners',
      sku: 'FS-WSC-3550',
      shipping: 'Low Stock',
      isWarning: true,
      image: 'grid_view'
    },
    {
      id: 'PROD-006',
      name: 'Berger Luxol Industrial Enamel - 20L White',
      category: 'Building Materials',
      sku: 'PA-BR-20W',
      shipping: 'Next Day Delivery',
      image: 'format_paint'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>

        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1, 2, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-3xl" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Product Catalogue</h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Enterprise B2B Marketplace • Lagos Supply Hub</p>
        </div>

        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400 group-focus-within:text-accent-orange transition-colors">search</span>
          </div>
          <input
            type="text"
            placeholder="Search materials or SKU..."
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-accent-orange transition-all font-bold text-sm shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${activeCategory === cat
                ? 'bg-navy-dark text-white shadow-lg shadow-navy-dark/20'
                : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-slate-300'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col group">
              <div className="aspect-square bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden flex items-center justify-center p-8">
                <span className="material-symbols-outlined text-slate-200 dark:text-slate-700 text-[120px] group-hover:scale-110 transition-transform duration-700 leading-none">{p.image}</span>
                {p.statusBadge && (
                  <div className="absolute top-6 right-6 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg text-[9px] font-black text-navy-dark dark:text-white tracking-[0.2em] uppercase border border-slate-100 dark:border-slate-800 shadow-sm">
                    {p.statusBadge}
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-navy-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <Link
                    href="/buyer/rfqs/new"
                    className="size-14 bg-white text-navy-dark rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all"
                  >
                    <span className="material-symbols-outlined font-black">add_shopping_cart</span>
                  </Link>
                </div>
              </div>

              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  <span>{p.category}</span>
                  <span className="text-slate-200">•</span>
                  <span>SKU: {p.sku}</span>
                </div>

                <h3 className="font-black text-navy-dark dark:text-white text-lg leading-tight mb-4 line-clamp-2 min-h-[3.5rem] uppercase tracking-tight">
                  {p.name}
                </h3>

                <div className={`mt-auto mb-8 p-3 rounded-xl flex items-center gap-3 ${p.isWarning ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-500'} dark:bg-slate-800/50 transition-colors`}>
                  <span className="material-symbols-outlined text-xl">{p.isWarning ? 'report' : 'local_shipping'}</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">{p.shipping}</p>
                </div>

                <Link
                  href="/buyer/rfqs/new"
                  className="w-full bg-accent-orange text-white font-black py-4 rounded-2xl text-[10px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 shadow-xl shadow-accent-orange/20 hover:bg-orange-600 active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">request_quote</span>
                  Request Quotation
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-6 animate-in zoom-in duration-500">
          <div className="size-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto grayscale opacity-50">
            <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
          </div>
          <div>
            <h4 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">No materials found</h4>
            <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Adjust your filters or try a different search term.</p>
          </div>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
            className="text-accent-orange font-black text-xs uppercase tracking-[0.2em] hover:underline decoration-2 underline-offset-8"
          >
            Clear All Search Filters
          </button>
        </div>
      )}

      {/* Pagination Placeholder */}
      <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {filteredProducts.length} of 1,240 items in {activeCategory}</p>
        <div className="flex items-center gap-4">
          <button className="size-12 rounded-2xl border-2 border-slate-50 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-navy-dark transition-all disabled:opacity-20" disabled>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <button key={i} className={`size-12 rounded-2xl flex items-center justify-center text-xs font-black ${i === 1 ? 'bg-navy-dark text-white' : 'text-slate-400 hover:bg-slate-50'}`}>{i}</button>
            ))}
          </div>
          <button className="size-12 rounded-2xl border-2 border-slate-50 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-navy-dark transition-all">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
