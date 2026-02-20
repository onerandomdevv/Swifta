'use client';

import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';

export default function BuyerVerificationPage() {
    const [loading, setLoading] = useState(true);
    const [idType, setIdType] = useState('NIN');
    const [isVerified, setIsVerified] = useState(false);
    const [accountNumber, setAccountNumber] = useState('');
    const [selectedBank, setSelectedBank] = useState('GTBank');

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
                <div className="space-y-4">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-12 w-96 rounded-xl" />
                </div>
                <div className="space-y-8">
                    <Skeleton className="h-96 w-full rounded-[2rem]" />
                    <Skeleton className="h-64 w-full rounded-[2rem]" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display text-accent-orange">Buyer Verification</h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide">Verify your individual identity to unlock bulk procurement and escrow features.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Status</p>
                    <StatusBadge status="PENDING" className="px-5 py-2" />
                </div>
            </div>

            {/* Stepper Indicator */}
            <div className="flex gap-4">
                <div className="flex-1 h-1.5 bg-accent-orange rounded-full"></div>
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-accent-orange/30 w-full animate-pulse"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* 1. Personal Identity Verification */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-navy-dark text-white flex items-center justify-center font-black text-xs shadow-lg shadow-navy-dark/20 text-accent-orange">01</div>
                            <div>
                                <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Individual Identity</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Government ID Verification</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Document Type</label>
                                <select
                                    value={idType}
                                    onChange={(e) => setIdType(e.target.value)}
                                    className="w-full px-6 py-4 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-2xl focus:border-accent-orange outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="NIN">National Identity Number (NIN)</option>
                                    <option value="DL">Driver's License</option>
                                    <option value="Passport">International Passport</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Number</label>
                                <input className="w-full px-6 py-4 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-2xl focus:border-accent-orange outline-none transition-all placeholder:text-slate-300 dark:text-white" placeholder="Enter ID number" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:border-accent-orange hover:bg-orange-50/5 dark:hover:bg-orange-500/5 transition-all cursor-pointer group/upload">
                                <div className="size-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover/upload:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-3xl text-slate-300 group-hover/upload:text-accent-orange transition-colors">upload_file</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-navy-dark dark:text-white">Upload ID Document</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Front View (Max 5MB)</p>
                                </div>
                            </div>
                            <div className="border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:border-accent-orange hover:bg-orange-50/5 dark:hover:bg-orange-500/5 transition-all cursor-pointer group/upload">
                                <div className="size-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover/upload:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-3xl text-slate-300 group-hover/upload:text-accent-orange transition-colors">face</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-navy-dark dark:text-white">Liveness Check</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Upload a selfie with ID</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Individual Bank Verification */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-navy-dark text-white flex items-center justify-center font-black text-xs shadow-lg shadow-navy-dark/20 text-accent-orange">02</div>
                            <div>
                                <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Settlement Bank Account</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Required for refunds and secure payments</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
                                <select
                                    value={selectedBank}
                                    onChange={(e) => setSelectedBank(e.target.value)}
                                    className="w-full px-6 py-4 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-2xl focus:border-accent-orange outline-none transition-all appearance-none cursor-pointer dark:text-white"
                                >
                                    <option>GTBank</option>
                                    <option>Access Bank</option>
                                    <option>Zenith Bank</option>
                                    <option>Kuda Bank</option>
                                    <option>Stanbic IBTC</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        maxLength={10}
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        className="flex-1 px-6 py-4 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-2xl focus:border-accent-orange outline-none transition-all placeholder:text-slate-300 dark:text-white"
                                        placeholder="Enter 10-digits"
                                    />
                                    <button
                                        onClick={() => setIsVerified(true)}
                                        className="px-8 py-4 bg-accent-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-accent-orange/20"
                                    >
                                        Verify
                                    </button>
                                </div>
                            </div>
                        </div>

                        {isVerified && (
                            <div className="bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-100 dark:border-orange-900/40 rounded-[1.5rem] p-6 flex items-center gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="size-14 rounded-2xl bg-accent-orange flex items-center justify-center text-white shrink-0 shadow-lg shadow-accent-orange/20">
                                    <span className="material-symbols-outlined text-2xl font-black">verified</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-accent-orange uppercase tracking-[0.2em] mb-1">Account Identity Confirmed</p>
                                    <p className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-tight font-display">SAMANTHA ISREAL PROCUREMENT</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Platform Help Note */}
            <div className="bg-navy-dark rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                <div className="flex items-center gap-6 relative z-10 text-white">
                    <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/5">
                        <span className="material-symbols-outlined text-3xl">security</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold leading-relaxed max-w-sm">Your data is encrypted and only used for identity verification.</p>
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Compliant with NDPR & Global Security Standards</p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-10 py-5 bg-accent-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-orange-500 hover:-translate-y-1 transition-all active:scale-95">Complete Verification</button>
                </div>
                <span className="material-symbols-outlined absolute -right-12 -bottom-12 text-[180px] text-white/5 font-light group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">shield</span>
            </div>
        </div>
    );
}
