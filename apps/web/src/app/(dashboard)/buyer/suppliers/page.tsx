'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function BuyerSuppliersPage() {
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const suppliers = [
        {
            id: 'VEND-001',
            name: 'Mainland Tools & Co.',
            type: 'Primary Dealer',
            category: 'Power Tools & Equipment',
            rating: 4.9,
            reviews: 128,
            verified: true,
            location: 'Alaba International, Lagos',
            joined: '2021',
            stats: { products: 450, rfqResponse: '98%', avgResponseTime: '< 2h' },
            image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=200'
        },
        {
            id: 'VEND-002',
            name: 'Lagos Construction Hub',
            type: 'Wholesaler',
            category: 'Building Materials',
            rating: 4.7,
            reviews: 85,
            verified: true,
            location: 'Oshodi Market, Lagos',
            joined: '2022',
            stats: { products: 1200, rfqResponse: '94%', avgResponseTime: '< 4h' },
            image: 'https://images.unsplash.com/photo-1590644365607-1c5a519a7a37?auto=format&fit=crop&q=80&w=200'
        },
        {
            id: 'VEND-003',
            name: 'Benson Electricals Ltd.',
            type: 'Specialist',
            category: 'Electrical Supplies',
            rating: 4.5,
            reviews: 42,
            verified: false,
            location: 'Lekki Phase 1, Lagos',
            joined: '2023',
            stats: { products: 310, rfqResponse: '89%', avgResponseTime: '~ 6h' },
            image: 'https://images.unsplash.com/photo-1558444479-c8f0279159a8?auto=format&fit=crop&q=80&w=200'
        },
        {
            id: 'VEND-004',
            name: 'Safety First Nigeria',
            type: 'Importer',
            category: 'Safety & PPE',
            rating: 5.0,
            reviews: 15,
            verified: true,
            location: 'Victoria Island, Lagos',
            joined: '2023',
            stats: { products: 85, rfqResponse: '100%', avgResponseTime: '< 1h' },
            image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=200'
        }
    ];

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="space-y-10 py-4 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-64 rounded-xl" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-14 w-80 rounded-2xl" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-80 w-full rounded-[2.5rem]" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Supplier Directory</h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Verified Lagos Hardware Merchants & Distributors</p>
                </div>

                <div className="relative w-full md:w-80 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-slate-400 group-focus-within:text-blue-600 transition-colors">search</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Search suppliers by name..."
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-sm shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredSuppliers.map((supplier) => (
                    <div key={supplier.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 size-40 bg-slate-50 dark:bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex flex-col sm:flex-row items-start gap-8 relative z-10">
                            <div className="flex flex-col items-center gap-4 shrink-0">
                                <div
                                    className="size-24 rounded-[2rem] bg-navy-dark bg-cover bg-center border-4 border-slate-50 dark:border-slate-800 shadow-xl group-hover:scale-105 transition-transform duration-500"
                                    style={{ backgroundImage: `url('${supplier.image}')` }}
                                ></div>
                                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                    <span className="material-symbols-outlined text-amber-500 text-sm font-black">star</span>
                                    <span className="text-[11px] font-black text-amber-700 dark:text-amber-400">{supplier.rating}</span>
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h3 className="text-2xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none">{supplier.name}</h3>
                                    {supplier.verified && (
                                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1 shadow-lg shadow-blue-600/20">
                                            <span className="material-symbols-outlined text-xs">verified</span>
                                            Verified
                                        </span>
                                    )}
                                </div>

                                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mb-4">{supplier.type} • {supplier.category}</p>

                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-8">
                                    <span className="material-symbols-outlined text-lg">location_on</span>
                                    <span className="text-[11px] font-bold uppercase tracking-tight">{supplier.location}</span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 border-t border-slate-50 dark:border-slate-800 pt-6">
                                    <div>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Products</p>
                                        <p className="text-sm font-black text-navy-dark dark:text-white">{supplier.stats.products}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">RFQ Rate</p>
                                        <p className="text-sm font-black text-navy-dark dark:text-white">{supplier.stats.rfqResponse}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Response</p>
                                        <p className="text-sm font-black text-navy-dark dark:text-white">{supplier.stats.avgResponseTime}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4 relative z-10">
                            <Link
                                href="/buyer/catalogue"
                                className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-navy-dark dark:text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-lg">grid_view</span>
                                View Inventory
                            </Link>
                            <button
                                onClick={() => alert('Messaging coming soon')}
                                className="size-14 bg-navy-dark text-white rounded-2xl flex items-center justify-center shadow-lg shadow-navy-dark/20 hover:scale-105 active:scale-90 transition-all"
                            >
                                <span className="material-symbols-outlined font-black">chat</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredSuppliers.length === 0 && (
                <div className="py-20 text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="size-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto grayscale opacity-50">
                        <span className="material-symbols-outlined text-5xl text-slate-300">person_search</span>
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">No suppliers found</h4>
                        <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Try searching for a specific merchant name or market location.</p>
                    </div>
                    <button
                        onClick={() => setSearchQuery('')}
                        className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] hover:underline decoration-2 underline-offset-8"
                    >
                        Show All Merchants
                    </button>
                </div>
            )}
        </div>
    );
}
