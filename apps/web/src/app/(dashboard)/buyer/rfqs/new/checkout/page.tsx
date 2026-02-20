'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatKobo } from '@hardware-os/shared';
import { Skeleton } from '@/components/ui/skeleton';

export default function RFQCheckoutPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    const cartItems = [
        { id: 1, name: 'Bosch GBH 2-28 F Rotary Hammer', qty: 2, price: 185000n, merchant: 'Mainland Tools & Co.' },
        { id: 2, name: 'Premium Type 2 Safety Helmets', qty: 10, price: 15000n, merchant: 'Safety First Nigeria' },
    ];

    const subtotal = cartItems.reduce((acc, item) => acc + (BigInt(item.qty) * item.price), 0n);
    const tax = subtotal / 20n;
    const total = subtotal + tax;

    const handleCheckout = async () => {
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            router.push('/buyer/orders/ORD-2024-X99');
        }, 2000);
    };

    if (loading) {
        return (
            <div className="space-y-10 py-4 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-64 rounded-xl" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-8">
                        <Skeleton className="h-80 w-full rounded-[2.5rem]" />
                        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
                    </div>
                    <div className="lg:col-span-4">
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
                    <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Secure Checkout</h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Finalize your procurement for project execution</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-10">
                    {/* Shipping & Delivery Section */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-8 relative z-10">
                            <span className="material-symbols-outlined text-navy-dark dark:text-white font-black">location_on</span>
                            <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Job Site Delivery</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                            <div className="space-y-6">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800 border-2 border-navy-dark rounded-3xl relative">
                                    <span className="absolute top-4 right-4 text-navy-dark material-symbols-outlined font-black">check_circle</span>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary Job Site</p>
                                    <p className="text-sm font-black text-navy-dark dark:text-white uppercase leading-relaxed">
                                        Plot 15, Admiralty Way, Lekki Phase 1, Lagos State, Nigeria.
                                    </p>
                                </div>
                                <button className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                                    <span className="material-symbols-outlined text-lg">add_location_alt</span>
                                    Add New Site
                                </button>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Delivery Notes</p>
                                <textarea
                                    className="w-full h-24 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-600 dark:text-slate-400 placeholder:text-slate-300 resize-none"
                                    placeholder="E.g. Call site engineer before arrival, exit by block A..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Section */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="material-symbols-outlined text-navy-dark dark:text-white font-black">payments</span>
                            <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Vault Settlement</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {[
                                { id: 'paystack', label: 'Online Payment', icon: 'credit_card', active: true },
                                { id: 'wallet', label: 'Vault Wallet', icon: 'account_balance_wallet', active: false },
                                { id: 'transfer', label: 'Bank Transfer', icon: 'account_balance', active: false },
                            ].map((method) => (
                                <button key={method.id} className={`p-6 rounded-[2rem] border-2 transition-all text-center space-y-3 ${method.active ? 'border-navy-dark bg-slate-50 dark:bg-slate-800' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}>
                                    <span className={`material-symbols-outlined text-3xl ${method.active ? 'text-navy-dark dark:text-white' : 'text-slate-300'}`}>{method.icon}</span>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${method.active ? 'text-navy-dark dark:text-white' : 'text-slate-400'}`}>{method.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Checkout Summary */}
                <div className="lg:col-span-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm sticky top-10">
                        <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-10 pb-4 border-b border-slate-50 dark:border-slate-800">Review Items</h3>

                        <div className="space-y-6 mb-10">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex justify-between items-center group">
                                    <div>
                                        <p className="text-[11px] font-black text-navy-dark dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">{item.name}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Qty: {item.qty} × {formatKobo(item.price)}</p>
                                    </div>
                                    <p className="text-[11px] font-black text-navy-dark dark:text-white">{formatKobo(BigInt(item.qty) * item.price)}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800 mb-10">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Subtotal</span>
                                <span className="text-navy-dark dark:text-white">{formatKobo(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Trading VAT (5.0%)</span>
                                <span className="text-navy-dark dark:text-white">{formatKobo(tax)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Handling Fee</span>
                                <span className="text-emerald-600">COVERED BY VAULT</span>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50 dark:border-slate-800 mb-10">
                            <div className="flex justify-between items-end">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Final Total</p>
                                <p className="text-4xl font-black text-navy-dark dark:text-white tracking-tighter uppercase leading-none">{formatKobo(total)}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isSubmitting}
                            className={`w-full py-5 bg-navy-dark text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/20 flex items-center justify-center gap-3 transition-all relative overflow-hidden ${isSubmitting ? 'opacity-80 cursor-wait' : 'hover:scale-[1.02] active:scale-95'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Verifying Transaction...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">verified_user</span>
                                    Pay and Finalize RFQ
                                </>
                            )}
                        </button>

                        <p className="mt-8 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60 px-6 leading-relaxed">
                            By placing the order, you agree to our terms of escrow and hardware procurement standards.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
