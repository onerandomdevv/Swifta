'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatKobo } from '@hardware-os/shared';
import { Skeleton } from '@/components/ui/skeleton';

export default function BuyerCartPage() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([
        { id: 1, name: 'Bosch GBH 2-28 F Rotary Hammer', qty: 2, price: 185000n, merchant: 'Mainland Tools & Co.' },
        { id: 2, name: 'Premium Type 2 Safety Helmets', qty: 10, price: 15000n, merchant: 'Safety First Nigeria' },
    ]);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    const subtotal = items.reduce((acc, item) => acc + (BigInt(item.qty) * item.price), 0n);
    const tax = subtotal / 20n; // 5% VAT
    const total = subtotal + tax;

    const removeItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    if (loading) {
        return (
            <div className="space-y-10 py-4 animate-in fade-in duration-500">
                <div className="space-y-4">
                    <Skeleton className="h-12 w-64 rounded-xl" />
                    <Skeleton className="h-4 w-96" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-6">
                        {[1, 2].map(i => (
                            <Skeleton key={i} className="h-40 w-full rounded-[2.5rem]" />
                        ))}
                    </div>
                    <div className="lg:col-span-4">
                        <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
                    </div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="size-32 rounded-[3rem] bg-slate-50 dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-6xl text-slate-200">shopping_basket</span>
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-navy-dark dark:text-white uppercase tracking-tight">Your cart is empty</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Materials added to your cart will appear here</p>
                </div>
                <Link href="/buyer/catalogue" className="px-10 py-4 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/20 hover:scale-105 active:scale-95 transition-all">
                    Browse Catalogue
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-1">
                <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Shopping Cart</h1>
                <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Ready to secure {items.length} items for your next project</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Cart Items */}
                <div className="lg:col-span-8 space-y-6">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
                                <div className="size-24 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform shadow-inner">
                                    <span className="material-symbols-outlined text-4xl text-slate-300">hardware</span>
                                </div>
                                <div className="flex-1 text-center sm:text-left space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <h4 className="font-black text-navy-dark dark:text-white text-xl uppercase tracking-tight">{item.name}</h4>
                                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded text-[8px] font-black tracking-widest uppercase w-fit mx-auto sm:mx-0">
                                            {item.merchant}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center sm:justify-start gap-6 pt-2">
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2 border border-slate-100 dark:border-slate-700">
                                            <button
                                                onClick={() => setItems(items.map(i => i.id === item.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))}
                                                className="text-slate-400 hover:text-navy-dark dark:hover:text-white transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm font-black">remove</span>
                                            </button>
                                            <span className="font-black text-sm text-navy-dark dark:text-white tabular-nums w-4 text-center">{item.qty}</span>
                                            <button
                                                onClick={() => setItems(items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i))}
                                                className="text-slate-400 hover:text-navy-dark dark:hover:text-white transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm font-black">add</span>
                                            </button>
                                        </div>
                                        <p className="font-black text-navy-dark dark:text-white text-lg tracking-tight">{formatKobo(item.price)} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">each</span></p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center sm:items-end gap-6 w-full sm:w-auto mt-4 sm:mt-0">
                                    <p className="font-black text-navy-dark dark:text-white text-2xl tracking-tighter uppercase leading-none">{formatKobo(BigInt(item.qty) * item.price)}</p>
                                    <button onClick={() => removeItem(item.id)} className="size-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-90">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            </div>
                            <div className="absolute -right-10 -bottom-10 size-40 bg-slate-50 dark:bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm sticky top-10">
                        <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-10 pb-4 border-b border-slate-50 dark:border-slate-800">Order Summary</h3>

                        <div className="space-y-6 mb-12">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Materials ({items.length})</span>
                                <span className="text-navy-dark dark:text-white">{formatKobo(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Trading VAT (5%)</span>
                                <span className="text-navy-dark dark:text-white">{formatKobo(tax)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Shipping Estimate</span>
                                <span className="text-emerald-600">FREE</span>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50 dark:border-slate-800 mb-10">
                            <div className="flex justify-between items-end">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform Total</p>
                                <p className="text-4xl font-black text-navy-dark dark:text-white tracking-tighter uppercase leading-none">{formatKobo(total)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Link href="/buyer/rfqs/new/checkout" className="w-full py-5 bg-navy-dark text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all group">
                                Proceed to Checkout
                                <span className="material-symbols-outlined text-lg group-hover:translate-x-2 transition-transform">arrow_forward</span>
                            </Link>
                            <Link href="/buyer/catalogue" className="w-full py-5 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center">
                                Continue Shopping
                            </Link>
                        </div>

                        <p className="mt-8 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">
                            Secure payments powered by Paystack & Hardware OS Vault
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
