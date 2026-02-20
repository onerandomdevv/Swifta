'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationCenter from '@/components/NotificationCenter';
import { useNotifications } from '@/hooks/use-notifications';

export default function BuyerLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { unreadCount } = useNotifications();

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            {/* Top Navigation Bar (Fixed 64px) */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-navy-dark text-white flex items-center justify-between px-6 z-50 border-b border-white/5 shadow-sm">
                <div className="flex items-center gap-8">
                    <Link href="/buyer/dashboard" className="flex items-center gap-2 group">
                        <div className="size-8 bg-white/10 rounded flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <span className="material-symbols-outlined text-white text-xl">architecture</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Hardware<span className="text-accent-orange">OS</span></h1>
                    </Link>
                </div>

                <div className="flex-1 max-w-2xl px-8 hidden md:block">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-white/50 text-xl group-focus-within:text-white transition-colors">search</span>
                        </div>
                        <input
                            className="block w-full bg-white/10 border-transparent focus:bg-white focus:text-navy-dark focus:ring-0 rounded-lg py-2 pl-10 pr-3 text-sm placeholder-white/60 transition-all outline-none"
                            placeholder="Search for tools, materials, or brands..."
                            type="text"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="p-2 hover:bg-white/10 rounded-full relative transition-colors"
                    >
                        <span className="material-symbols-outlined">notifications</span>
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 size-2 bg-accent-orange rounded-full border-2 border-navy-dark animate-pulse"></span>
                        )}
                    </button>
                    <Link href="/buyer/cart" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <span className="material-symbols-outlined">shopping_cart</span>
                    </Link>
                    <div className="h-8 w-[1px] bg-white/20 mx-2 hidden sm:block"></div>
                    <div className="flex items-center gap-3 cursor-pointer hover:bg-white/10 p-1 pr-3 rounded-full transition-colors group">
                        <div className="size-8 rounded-full bg-accent-orange flex items-center justify-center font-bold text-xs text-white">SI</div>
                        <span className="text-sm font-medium hidden sm:block group-hover:text-white/90">Lagos Branch</span>
                    </div>
                </div>
            </header>

            <NotificationCenter
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
            />

            <div className="flex pt-16 min-h-screen">
                {/* Left Sidebar Navigation */}
                <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto hidden lg:block sticky top-16 h-[calc(100vh-64px)]">
                    <div className="p-6">
                        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Navigation</h2>
                        <nav className="space-y-1 mb-8">
                            {[
                                { label: 'Dashboard', icon: 'dashboard', href: '/buyer/dashboard' },
                                { label: 'All Products', icon: 'grid_view', href: '/buyer/catalogue' },
                                { label: 'My RFQs', icon: 'description', href: '/buyer/rfqs' },
                                { label: 'My Orders', icon: 'local_shipping', href: '/buyer/orders' },
                                { label: 'Verification', icon: 'verified_user', href: '/buyer/verification' },
                            ].map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all group ${isActive
                                            ? 'bg-navy-dark/5 text-navy-dark dark:bg-white/10 dark:text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <span className={`material-symbols-outlined text-xl ${isActive ? 'text-navy-dark dark:text-white' : 'text-slate-400 group-hover:text-navy-dark dark:group-hover:text-white'}`}>
                                            {item.icon}
                                        </span>
                                        <span className="text-sm">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Categories</h2>
                        <nav className="space-y-1 mb-8">
                            {[
                                { label: 'Power Tools', icon: 'construction' },
                                { label: 'Building Materials', icon: 'format_paint' },
                                { label: 'Plumbing & Fittings', icon: 'plumbing' },
                                { label: 'Electrical Supplies', icon: 'electrical_services' },
                                { label: 'Safety & PPE', icon: 'chef_hat' },
                            ].map((cat) => (
                                <a
                                    key={cat.label}
                                    className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                                    href="#"
                                >
                                    <span className="material-symbols-outlined text-slate-400 group-hover:text-navy-dark dark:group-hover:text-white text-xl">
                                        {cat.icon}
                                    </span>
                                    <span className="text-sm">{cat.label}</span>
                                </a>
                            ))}
                        </nav>

                        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Filter By</h2>
                        <div className="space-y-6">
                            <div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white mb-3 block">Brand</span>
                                <div className="space-y-2">
                                    {['Bosch Professional', 'Makita Industrial', 'Dangote Cement'].map((brand) => (
                                        <label key={brand} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-navy-dark dark:hover:text-white transition-colors">
                                            <input className="rounded border-slate-300 dark:border-slate-700 text-accent-orange focus:ring-accent-orange bg-transparent" type="checkbox" />
                                            {brand}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white mb-3 block">Stock Status</span>
                                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-navy-dark dark:hover:text-white transition-colors">
                                    <input defaultChecked className="rounded border-slate-300 dark:border-slate-700 text-accent-orange focus:ring-accent-orange bg-transparent" type="checkbox" />
                                    In Stock (Lagos Warehouse)
                                </label>
                            </div>
                        </div>

                        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <Link href="/logout" className="flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors group font-medium">
                                <span className="material-symbols-outlined text-xl">logout</span>
                                <span className="text-sm">Logout</span>
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-background-light dark:bg-[#111821] selection:bg-accent-orange/10 selection:text-accent-orange">
                    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
