'use client';

import React from 'react';
import Link from 'next/link';

export default function BuyerOrdersPage() {
  const stats = [
    { label: 'Total Purchases', value: '124', trend: '+12% this month', trendType: 'up' },
    { label: 'Pending Payment', value: '3', badge: 'Action required', badgeColor: 'bg-amber-50 text-amber-600 border-amber-100' },
    { label: 'Total Spent (MTD)', value: '₦4,250,000', trend: '+5.4%', trendType: 'up' },
  ];

  const orders = [
    {
      id: 'ORD-90214',
      merchant: 'Total Iron & Rods Ltd',
      initials: 'TI',
      date: 'Oct 24, 2023',
      amount: '1,250,000.00',
      status: 'PENDING PAYMENT',
      hasAction: true,
      actionLabel: 'Pay Now'
    },
    {
      id: 'ORD-89441',
      merchant: 'Lagos Steel Mills',
      initials: 'LS',
      date: 'Oct 22, 2023',
      amount: '640,000.00',
      status: 'PROCESSING',
    },
    {
      id: 'ORD-88129',
      merchant: 'BuildPro Supplies',
      initials: 'BP',
      date: 'Oct 18, 2023',
      amount: '2,100,000.00',
      status: 'COMPLETED',
    },
    {
      id: 'ORD-87992',
      merchant: 'Alaba King Hardware',
      initials: 'AK',
      date: 'Oct 15, 2023',
      amount: '85,000.00',
      status: 'SHIPPED',
    }
  ];

  return (
    <div className="space-y-10 py-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Order History</h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Manage your hardware procurement across all merchants in Lagos. Track shipping status and complete pending payments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm">
            <span className="material-symbols-outlined text-lg">download</span>
            Export CSV
          </button>
          <Link href="/buyer/catalogue" className="flex items-center gap-2 px-6 py-3 bg-navy-dark text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-navy-dark/20 hover:-translate-y-0.5 transition-all active:scale-95">
            <span className="material-symbols-outlined text-lg">add</span>
            New Procurement
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, idx) => (
          <div key={idx} className={`bg-white dark:bg-slate-900 rounded-[2rem] p-8 border shadow-sm relative overflow-hidden group ${idx === 1 ? 'border-amber-200 dark:border-amber-900/40 border-l-4' : 'border-slate-100 dark:border-slate-800'}`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{stat.label}</p>
            <div className="flex items-baseline gap-3">
              <h3 className="text-3xl font-black text-navy-dark dark:text-white tracking-tighter uppercase leading-none">{stat.value}</h3>
              {stat.trend && (
                <span className={`text-[9px] font-black tracking-widest uppercase ${stat.trendType === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stat.trend}
                </span>
              )}
            </div>
            {stat.badge && (
              <div className="mt-4 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${stat.badgeColor}`}>
                  {stat.badge}
                </span>
                {idx === 1 && <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Table Area */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-navy-dark/5 overflow-hidden">
        {/* Toolbar */}
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {['All Orders', 'Pending Payment', 'In Transit', 'Completed'].map((tab, i) => (
              <button
                key={tab}
                className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${i === 0 ? 'bg-navy-dark text-white' : 'text-slate-400 hover:text-navy-dark dark:hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-3 px-6 py-2.5 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            Last 30 days
            <span className="material-symbols-outlined text-lg">expand_more</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Merchant Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Amount (₦)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {orders.map((order, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300">
                  <td className="px-8 py-7">
                    <p className="text-sm font-black text-navy-dark dark:text-white leading-tight">#{order.id}</p>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                        {order.initials}
                      </div>
                      <p className="text-sm font-bold text-navy-dark dark:text-white">{order.merchant}</p>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{order.date}</p>
                  </td>
                  <td className="px-8 py-7">
                    <p className="text-sm font-black text-navy-dark dark:text-white tracking-tight">₦{order.amount}</p>
                  </td>
                  <td className="px-8 py-7">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${order.status === 'PENDING PAYMENT' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10' :
                        order.status === 'PROCESSING' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10' :
                          order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10' :
                            'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/10'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-7 text-right">
                    {order.hasAction ? (
                      <button className="px-6 py-2 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all active:scale-95">
                        {order.actionLabel}
                      </button>
                    ) : (
                      <button className="p-2 text-slate-300 hover:text-navy-dark transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-0">
            Showing <span className="text-navy-dark dark:text-white">1 to 4</span> of <span className="text-navy-dark dark:text-white">124 results</span>
          </p>
          <div className="flex items-center gap-4">
            <button className="p-2.5 rounded-xl border-2 border-slate-50 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed" disabled>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((pg, i) => (
                <button
                  key={i}
                  className={`size-9 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${pg === 1 ? 'bg-navy-dark text-white' : 'text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-navy-dark'}`}
                >
                  {pg}
                </button>
              ))}
            </div>
            <button className="p-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-navy-dark dark:text-white hover:border-navy-dark transition-all active:scale-95">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Order Help Box */}
      <div className="bg-navy-dark rounded-[2.5rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden group">
        <div className="relative z-10 space-y-4 max-w-xl">
          <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Need assistance with your bulk orders?</h2>
          <p className="text-white/60 text-sm font-bold leading-relaxed uppercase tracking-wide">Our account managers are available 24/7 to help with logistics and large-scale procurement for construction sites across Lagos State.</p>
        </div>
        <button className="relative z-10 px-10 py-5 bg-white text-navy-dark rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:-translate-y-1 transition-all active:scale-95 whitespace-nowrap">
          Talk to an Agent
        </button>
        <div className="absolute -bottom-20 -left-20 size-80 bg-white/5 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-[3s]"></div>
      </div>
    </div>
  );
}
