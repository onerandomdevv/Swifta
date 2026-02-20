'use client';

import React from 'react';
import Link from 'next/link';

export default function MerchantQuotesPage() {
    const stats = [
        { label: 'Active Quotes', value: '42', trend: '+12%', trendColor: 'text-emerald-600' },
        { label: 'Conversion Rate', value: '68%', trend: 'Steady', trendColor: 'text-slate-500' },
        { label: 'Pipeline Value', value: '₦12.8M', trend: '+₦2.1M this week', trendColor: 'text-emerald-600' },
        { label: 'Avg. Response', value: '4.2h', trend: '-20m from prev', trendColor: 'text-emerald-600' },
    ];

    const quotes = [
        {
            id: 'QT-2024-101',
            rfqId: 'RFQ-0892',
            product: 'M20 Grade 8.8 Hex Bolts',
            customer: 'Ikeja Plumbing Systems',
            total: '₦625,000.00',
            date: 'Today, 10:45 AM',
            status: 'Sent',
            customerInitial: 'IP'
        },
        {
            id: 'QT-2024-102',
            rfqId: 'RFQ-0441',
            product: 'Industrial Power Drill XL',
            customer: 'Victoria Island Construction',
            total: '₦85,000.00',
            date: 'Yesterday, 02:20 PM',
            status: 'Accepted',
            customerInitial: 'VC'
        },
        {
            id: 'QT-2024-103',
            rfqId: 'RFQ-0112',
            product: 'Industrial Copper Pipes (10m)',
            customer: 'Lekki Housing Project',
            total: '₦450,000.00',
            date: 'Oct 21, 2023',
            status: 'Negotiating',
            customerInitial: 'LH'
        },
        {
            id: 'QT-2024-104',
            rfqId: 'RFQ-0992',
            product: 'Heavy-Duty Circular Saw',
            customer: 'Apapa Port Services',
            total: '₦120,500.00',
            date: 'Oct 20, 2023',
            status: 'Expired',
            customerInitial: 'AP'
        }
    ];

    return (
        <div className="space-y-8 py-2">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Quotes Center</h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide">Manage and track your active trade offers and conversions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">
                        <span className="material-symbols-outlined text-lg">file_download</span>
                        Export History
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
                        <div className="flex items-baseline gap-3">
                            <p className="text-3xl font-black text-navy-dark dark:text-white tracking-tight leading-none">{stat.value}</p>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${stat.trendColor}`}>{stat.trend}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quotes Hub Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl shadow-navy-dark/5">
                {/* Filters Top Bar */}
                <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                        <div className="relative flex-1 max-w-md group">
                            <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-navy-dark transition-colors">
                                <span className="material-symbols-outlined text-xl">search</span>
                            </span>
                            <input
                                className="w-full pl-12 pr-6 py-3.5 text-xs font-bold border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-900 rounded-2xl focus:border-navy-dark dark:focus:border-blue-500 transition-all outline-none text-navy-dark dark:text-white placeholder:text-slate-400"
                                placeholder="Search by quote ID, product, or customer..."
                                type="text"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                        <select className="text-[10px] font-black uppercase tracking-widest border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white rounded-xl focus:border-navy-dark focus:ring-0 py-2.5 px-6 appearance-none cursor-pointer">
                            <option>All Quotes</option>
                            <option>Accepted</option>
                            <option>Sent</option>
                            <option>Negotiating</option>
                            <option>Expired</option>
                        </select>
                    </div>
                </div>

                {/* List Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quote & RFQ</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trade Value</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Submissions</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {quotes.map((quote, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="size-10 rounded-xl bg-navy-dark/5 dark:bg-white/5 flex items-center justify-center border border-navy-dark/10 dark:border-white/10 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-navy-dark dark:text-white text-xl">file_present</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-navy-dark dark:text-white leading-tight mb-1">{quote.id}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RFQ ID: {quote.rfqId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                                                {quote.customerInitial}
                                            </div>
                                            <p className="text-sm font-bold text-navy-dark dark:text-white">{quote.customer}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-black text-navy-dark dark:text-white tracking-tight">{quote.total}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">VAT Incl.</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{quote.date}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border h-7 ${quote.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400' :
                                                quote.status === 'Sent' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400' :
                                                    quote.status === 'Negotiating' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400' :
                                                        'bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-800 dark:text-slate-500'
                                            }`}>
                                            <span className={`size-1.5 rounded-full mr-2 ${quote.status === 'Accepted' ? 'bg-emerald-500' :
                                                    quote.status === 'Sent' ? 'bg-blue-500' :
                                                        quote.status === 'Negotiating' ? 'bg-amber-500' : 'bg-slate-300'
                                                }`}></span>
                                            {quote.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <Link
                                            href={`/merchant/rfqs/${quote.rfqId}`}
                                            className="size-10 rounded-xl text-slate-400 hover:text-navy-dark hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 inline-flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined">visibility</span>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-0">
                        Showing <span className="text-navy-dark dark:text-white">1 - 4</span> of <span className="text-navy-dark dark:text-white">42</span> quotes
                    </p>
                    <div className="flex items-center gap-4">
                        <button className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest border-2 border-slate-100 dark:border-slate-800 rounded-xl text-slate-300 dark:text-slate-600 cursor-not-allowed" disabled>
                            Prev
                        </button>
                        <div className="flex items-center gap-1">
                            <button className="size-9 flex items-center justify-center rounded-xl text-xs font-black bg-navy-dark text-white shadow-lg shadow-navy-dark/20">1</button>
                            <button className="size-9 flex items-center justify-center rounded-xl text-xs font-black text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-colors">2</button>
                        </div>
                        <button className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-navy-dark dark:text-white hover:border-navy-dark transition-all active:scale-95">
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Pro Tip */}
            <div className="flex items-center gap-4 p-6 rounded-3xl bg-emerald-600 text-white border border-white/10 shadow-xl relative overflow-hidden group">
                <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                    <span className="material-symbols-outlined text-white">insights</span>
                </div>
                <div>
                    <p className="text-[11px] font-black uppercase tracking-widest mb-1">Conversion Booster</p>
                    <p className="text-xs text-white/80 font-medium tracking-tight">Quotes with <span className="text-white font-bold italic">Lead Time &lt; 2 days</span> have a <span className="text-white font-black italic">45% higher acceptance rate</span> this month. Keep it fast!</p>
                </div>
                <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-[120px] text-white/5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">trending_up</span>
            </div>
        </div>
    );
}
