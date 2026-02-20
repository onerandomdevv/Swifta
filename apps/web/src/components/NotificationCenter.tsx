'use client';

import React, { useState } from 'react';

interface Notification {
    id: string;
    title: string;
    desc: string;
    time: string;
    type: 'quote' | 'shipping' | 'payment' | 'inventory' | 'verification';
    icon: string;
    iconColor: string;
    bg: string;
    unread: boolean;
    action?: string;
    category: 'Orders' | 'Financials' | 'System';
}

export default function NotificationCenter({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'All' | 'Orders' | 'Financials'>('All');

    const notifications: Notification[] = [
        {
            id: '1',
            title: 'New Quote Received',
            desc: 'Mainland Supplies submitted a bid for 500 units of Reinforcement Bars.',
            time: '2 mins ago',
            type: 'quote',
            icon: 'payments',
            iconColor: 'text-blue-500',
            bg: 'bg-blue-50/50',
            unread: true,
            action: 'Review Quote',
            category: 'Orders'
        },
        {
            id: '2',
            title: 'Order Dispatched',
            desc: 'Shipment #HWD-902 (Galvanized Sheets) is en route to Lagos Port terminal B.',
            time: '10:30 AM',
            type: 'shipping',
            icon: 'local_shipping',
            iconColor: 'text-orange-500',
            bg: 'bg-orange-50/50',
            unread: true,
            action: 'Tracking Active',
            category: 'Orders'
        },
        {
            id: '3',
            title: 'Payment Confirmed',
            desc: 'Transaction for Invoice #2204 has been successfully verified by Finance.',
            time: '1 hr ago',
            type: 'payment',
            icon: 'check_circle',
            iconColor: 'text-emerald-500',
            bg: 'bg-emerald-50/50',
            unread: true,
            category: 'Financials'
        },
        {
            id: '4',
            title: 'Inventory Alert',
            desc: 'Stock level low for Grade A Galvanized Sheets. 12 units remaining.',
            time: 'Yesterday',
            type: 'inventory',
            icon: 'inventory_2',
            iconColor: 'text-slate-500',
            bg: 'bg-slate-50/50',
            unread: false,
            category: 'System'
        },
        {
            id: '5',
            title: 'Account Verified',
            desc: 'Your profile has been fully verified. You can now bid on government hardware tenders.',
            time: 'Oct 24',
            type: 'verification',
            icon: 'verified',
            iconColor: 'text-blue-400',
            bg: 'bg-blue-50/20',
            unread: false,
            category: 'System'
        }
    ];

    const filtered = notifications.filter(n =>
        activeTab === 'All' ? true : n.category === activeTab
    );

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={onClose}
                ></div>
            )}

            {/* Slide-out Panel */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 z-[70] shadow-2xl border-l border-slate-100 dark:border-slate-800 transition-transform duration-500 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">Notification Center</h3>
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full animate-pulse">3 NEW</span>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-navy-dark dark:hover:text-white transition-all">
                        <span className="material-symbols-outlined font-black">close</span>
                    </button>
                </div>

                {/* Content Description */}
                <div className="px-8 pt-6 pb-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Manage your real-time B2B trade alerts and logistics updates.</p>
                </div>

                {/* Tabs */}
                <div className="px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-6">
                            {['All', 'Orders', 'Financials'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`text-[10px] font-black uppercase tracking-widest relative pb-4 transition-all ${activeTab === tab ? 'text-navy-dark dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab}
                                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-navy-dark dark:bg-white rounded-full"></div>}
                                </button>
                            ))}
                        </div>
                        <button className="text-[9px] font-black text-slate-400 hover:text-navy-dark dark:hover:text-white uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">done_all</span>
                            Mark all read
                        </button>
                    </div>
                </div>

                {/* List Section */}
                <div className="flex-1 overflow-y-auto px-8 pb-32 space-y-4">
                    {filtered.map((n) => (
                        <div key={n.id} className={`p-6 rounded-3xl border transition-all cursor-pointer relative group ${n.unread ? 'bg-white dark:bg-slate-800/20 border-slate-100 dark:border-slate-800 shadow-sm' : 'bg-slate-50/50 dark:bg-slate-900/20 border-transparent opacity-80'}`}>
                            {n.unread && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-navy-dark dark:bg-blue-500 rounded-r-full"></div>}
                            <div className="flex gap-4">
                                <div className={`size-12 rounded-2xl ${n.bg} flex items-center justify-center border border-transparent group-hover:scale-110 transition-transform`}>
                                    <span className={`material-symbols-outlined font-black ${n.iconColor}`}>{n.icon}</span>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-tight">{n.title}</h4>
                                        <span className="text-[9px] font-black text-slate-400 uppercase">{n.time}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tight opacity-80">
                                        {n.desc}
                                    </p>

                                    {n.action && (
                                        <div className="pt-2 flex items-center gap-3">
                                            {n.type === 'quote' && (
                                                <>
                                                    <button className="px-5 py-2 bg-navy-dark text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-navy-dark/10">Review Quote</button>
                                                    <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-navy-dark transition-colors">Dismiss</button>
                                                </>
                                            )}
                                            {n.type === 'shipping' && (
                                                <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 text-orange-600 rounded-lg border border-orange-500/20">
                                                    <span className="material-symbols-outlined text-xs font-black">location_on</span>
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Tracking Active</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sticky Footer */}
                <div className="absolute bottom-0 left-0 w-full p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-50 dark:border-slate-800">
                    <button className="w-full py-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-navy-dark dark:text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                        View All Activity History
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>
            </div>
        </>
    );
}
