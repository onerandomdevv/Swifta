'use client';

import React, { useState, useEffect } from 'react';
import { formatKobo } from '@hardware-os/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';

export default function MerchantAnalyticsPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const kpis = [
        { label: 'Pipeline Value', value: formatKobo(1280000000n), trend: '+12.4%', trendType: 'up', subtext: 'vs last month', icon: 'info' },
        { label: 'Acceptance Rate', value: '68%', trend: '+5%', trendType: 'up', subtext: 'MoM', icon: 'query_stats' },
        { label: 'Avg. Response Time', value: '2.4 hours', trend: '12 min', trendType: 'down', subtext: 'faster than avg.', icon: 'timer' },
    ];

    const tradeHistory = [
        { id: '#TR-8821', product: 'Cement (50kg)', supplier: 'Dangote Group', value: 45000000n, date: 'Oct 24, 2023', status: 'COMPLETED', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQkVCOJ8p25r2QjW-cGmBtmzl-U3uFTt8DrC-FvCD-lkpsTp0q2byFXtIEdku11Os8dx2wSjkg46M3THKjy5z4jiQtuSBz8gW_6xwj89jUcEbDWf3dB4CznRTMwiRiLgUdGV1z3A5o1xximTYz_W2SN4IHW6T-gOPAHmgP8SSaX11MCw3drmtjApI5JCR7Va4bgcXluZYj3U5HnxP7XOWmz_zsOos-YQHNYAIaEyiWo4GjRpeL8p0ZX1rflrUUU8zy8lHDdLXGNQ' },
        { id: '#TR-8822', product: 'Rebar 12mm', supplier: 'Ikeja Steel', value: 120000000n, date: 'Oct 25, 2023', status: 'DISPATCHED', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMK5EXH9aM2TAJVFtgG7vqMxSfUJDlfYr-RB9WSlU7nXLsj48OvTlQzPcSBaRAQwGhcQx-qdPK-IFbIdx_ldnbWweI2Zxq_emvOL2Yf2K13WP9zBsEoPej8-7US9lop_IPEgVEvQRTWBYRzBeBxolcPkS2QyDMN_rnL0K1gaJryfig62-zibT6LovYql5dp3wlnJbsBnHOBdAU5_EobF0H39E3i-bVYqJs8svA6pvaa_UcTjwgsbLcTbmUla3l48I5uNJb4JDDmw' },
        { id: '#TR-8823', product: 'Power Drill XL', supplier: 'Bosch Lagos', value: 8500000n, date: 'Oct 25, 2023', status: 'PENDING', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlAW-idukIZ2GJVWtisG4QwcGOfFzeeIbl5i2A0Bl6Q2UFRdUM97PShnknepV83f0hzcdSNXiYZWeiPDFqUa3AbcNJIbLdEwDgQfMLmnv2Qo5S0kGKyfQn3z4LrwhW5XQwCk4o4QkaEbWf62qjFFXpBBkABMzl-50ZSyY8KUuJ8AL7Cq1x-tEMlJo9BuAzRMsK0XpQG0jJOTZwg1eMaoBXt5MilsdEOeLdQbpshXWcU7BkQ0j2BYMT0ft4dNGJPiXq6IJ3qazvBw' },
        { id: '#TR-8824', product: 'PVC Pipes', supplier: 'PlumbLine Ltd', value: 21000000n, date: 'Oct 26, 2023', status: 'COMPLETED', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn6izDCoIXkyxIBpoVgzr74rGmmyOupkb7JEWV9krVnqv_WTN1dWjd0vnsbC07ZV5OtixFmwwzvybU5DRYdvrcz9B78YW4kNtcBGGqSB2jqpXimdq74DqLv2nz5njVbzyDLU8MshtHEyzeKbiI98NDcyHn7pIuxHg4gCJscYm9fFtzy3Nl6nIfNuf9-fiIbmxGGhl0Drz6K1xxa1i_kEshHH2d_7mkPja1V8VBHASHmvMndEL2yiGPScnHxgZsql8qzg3o5hSJAw' },
    ];

    if (loading) {
        return (
            <div className="space-y-8 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-44 w-full rounded-3xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
                        <Skeleton className="h-[300px] w-full rounded-[2.5rem]" />
                    </div>
                    <aside className="space-y-8">
                        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
                        <Skeleton className="h-96 w-full rounded-[2.5rem]" />
                    </aside>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Merchant Analytics</h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide">Performance metrics and trade historical insights.</p>
                </div>
            </div>

            {/* KPI Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{kpi.label}</p>
                            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary-navy transition-colors">{kpi.icon}</span>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-3xl font-black text-navy-dark dark:text-white tracking-tight leading-none uppercase">{kpi.value}</h3>
                            <div className="flex items-center gap-2">
                                <span className={`material-symbols-outlined text-base font-bold ${kpi.trendType === 'up' ? 'text-emerald-500' : 'text-emerald-500'}`}>
                                    {kpi.trendType === 'up' ? 'trending_up' : 'expand_more'}
                                </span>
                                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500">
                                    {kpi.trend} <span className="text-slate-400 font-bold ml-1 tracking-tight lowercase">{kpi.subtext}</span>
                                </p>
                            </div>
                        </div>
                        {kpi.label === 'Acceptance Rate' && (
                            <div className="mt-8 h-10 w-full overflow-hidden opacity-30">
                                <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                                    <path d="M0 50 Q 50 40, 100 45 T 200 10" fill="none" stroke="#2e30b8" strokeWidth="3" />
                                </svg>
                            </div>
                        )}
                        {kpi.label === 'Avg. Response Time' && (
                            <div className="mt-8 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="bg-primary-navy h-full w-[85%] rounded-full"></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <main className="lg:col-span-2 space-y-8">
                    {/* Pipeline Trends Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-10 shadow-sm overflow-hidden relative">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black text-navy-dark dark:text-white tracking-tight leading-none uppercase">Conversion Pipeline Trends</h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-2">Historical data overview</p>
                            </div>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-700 text-navy-dark dark:text-white rounded-lg shadow-sm">Weekly</button>
                                <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-navy-dark dark:hover:text-white transition-colors">Monthly</button>
                            </div>
                        </div>

                        <div className="relative h-[280px] w-full flex flex-col justify-between">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center z-10 group cursor-default">
                                    <span className="material-symbols-outlined text-slate-200 dark:text-slate-800 text-7xl font-light mb-4 block group-hover:scale-110 transition-transform">insights</span>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Data visualization will populate here</p>
                                </div>
                                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1000 300" preserveAspectRatio="none">
                                    <path d="M0 250 Q 250 200, 500 230 T 1000 50" fill="none" stroke="#1b2a4b" strokeWidth="2" strokeDasharray="8 6" />
                                </svg>
                            </div>

                            <div className="mt-auto flex justify-between px-4 border-t border-slate-50 dark:border-slate-800 pt-6">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                    <span key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Trade History Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-navy-dark/5 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <h3 className="text-xl font-black text-navy-dark dark:text-white tracking-tight uppercase">Trade History</h3>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative group">
                                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-navy-dark transition-colors">
                                        <span className="material-symbols-outlined text-lg">search</span>
                                    </span>
                                    <input className="pl-11 pr-6 py-2.5 text-[10px] font-black border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-900 rounded-xl focus:border-navy-dark outline-none w-64 uppercase tracking-widest placeholder:text-slate-300 dark:text-white transition-all" placeholder="Search Trades..." />
                                </div>
                                <button className="p-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-navy-dark dark:hover:text-white transition-all bg-white dark:bg-slate-900">
                                    <span className="material-symbols-outlined text-xl">filter_list</span>
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-navy-dark text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-navy-dark/20 hover:-translate-y-0.5 transition-all active:scale-95">
                                    <span className="material-symbols-outlined text-lg">download</span>
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trade ID & Product</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Supplier</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Value</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {tradeHistory.map((trade, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300">
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="text-sm font-black text-navy-dark dark:text-white leading-tight mb-1">{trade.id}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{trade.product}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                                                        <img src={trade.logo} alt={trade.supplier} className="size-full object-cover p-1" />
                                                    </div>
                                                    <p className="text-[11px] font-black text-navy-dark dark:text-white uppercase tracking-tight">{trade.supplier}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <p className="text-sm font-black text-navy-dark dark:text-white tracking-tight">{formatKobo(trade.value)}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{trade.date}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <StatusBadge status={trade.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>

                <aside className="space-y-8 sticky top-24">
                    {/* Conversion Booster Widget */}
                    <div className="bg-[#f0f7ff] dark:bg-blue-950/20 border-2 border-[#2e75b6] dark:border-blue-500/30 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 text-[#2e75b6]/10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                            <span className="material-symbols-outlined text-[160px]">lightbulb</span>
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-md shadow-blue-500/10">
                                    <span className="material-symbols-outlined text-[#2e75b6] font-black">lightbulb</span>
                                </div>
                                <h4 className="text-navy-dark dark:text-white font-black text-sm uppercase tracking-widest leading-tight">Pro-Tip: Boost Conversions</h4>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-xs font-bold leading-relaxed">
                                Merchants who respond within <span className="text-[#2e75b6] font-black uppercase">1 hour</span> have a <span className="text-[#2e75b6] font-black">35% higher acceptance rate</span>. Try reducing your lead time today.
                            </p>
                            <button className="w-full py-5 px-6 bg-[#2e30b8] hover:bg-navy-dark text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                                Reduce Lead Time
                            </button>
                        </div>
                    </div>

                    {/* Regional Demand Card (Updated) */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="material-symbols-outlined text-primary-navy font-black">location_on</span>
                            <h4 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Regional Highlights</h4>
                        </div>
                        <div className="space-y-8">
                            {[
                                { loc: 'Lekki Phase 1', val: '42%' },
                                { loc: 'Ikeja Industrial', val: '31%' },
                                { loc: 'Victoria Island', val: '18%' }
                            ].map(region => (
                                <div key={region.loc} className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>{region.loc}</span>
                                        <span className="text-navy-dark dark:text-white">{region.val}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary-navy rounded-full" style={{ width: region.val }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 p-5 bg-navy-dark/5 dark:bg-white/5 rounded-2xl border border-dashed border-navy-dark/10 dark:border-white/10">
                            <p className="text-[10px] text-slate-400 font-bold text-center leading-relaxed italic">
                                "Lekki seeing high demand for Power Tools this week."
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
