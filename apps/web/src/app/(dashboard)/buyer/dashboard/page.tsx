"use client";

import React from "react";
import Link from "next/link";
import { useBuyerDashboard } from "@/hooks/use-buyer-data";
import { DashboardSkeleton } from "@/components/buyer/dashboard/dashboard-skeleton";
import { BuyerSummaryCards } from "@/components/buyer/dashboard/buyer-summary-cards";
import { ActiveDeliveries } from "@/components/buyer/dashboard/active-deliveries";
import { WhatsAppLinkStatus } from "@/components/dashboard/whatsapp-link-status";

export default function BuyerDashboard() {
  const { orders, stats, user, isLoading, isError, error, refetch } =
    useBuyerDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-red-400">
            error
          </span>
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Failed to load dashboard</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-1">{error}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-8 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          Try Again
        </button>
      </div>
    );
  }

  const activeOrders = orders.filter(
    (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED",
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
              Buyer Command Center
            </span>
            {user?.emailVerified && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                <span className="material-symbols-outlined text-xs">verified</span>
                Verified Account
              </span>
            )}
          </div>
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight">
            Hi, {user?.firstName || "there"} 👋
          </h1>
          <p className="text-slate-500 font-medium">
            Welcome back to your SwiftTrade procurement dashboard.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/buyer/catalogue"
            className="flex-1 md:flex-none px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-sm">storefront</span>
            Shop Catalogue
          </Link>
          <Link
            href="/buyer/saved"
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary transition-colors rounded-xl shadow-sm"
          >
            <span className="material-symbols-outlined">favorite</span>
          </Link>
        </div>
      </header>

      {/* Stats Section */}
      <section>
        <BuyerSummaryCards
          activeOrdersCount={stats?.activeOrdersCount ?? activeOrders.length}
          totalSpendingKobo={stats?.totalSpendingKobo}
          orders={orders}
        />
      </section>

      {/* WhatsApp Link Banner */}
      <section className="animate-in slide-in-from-bottom-4 duration-1000 delay-200">
        <WhatsAppLinkStatus
          isLinked={!!user?.isWhatsAppLinked}
          onSuccess={refetch}
        />
      </section>

      {/* Deliveries Section */}
      <section className="animate-in slide-in-from-bottom-4 duration-1000 delay-300">
        <ActiveDeliveries deliveries={activeOrders} />
        
        {activeOrders.length === 0 && (
          <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-3xl text-slate-300">
                package_2
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No active deliveries</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                Once you place an order and it&apos;s processed, you can track it here in real-time.
              </p>
            </div>
            <Link
              href="/buyer/catalogue"
              className="inline-flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:translate-x-1 transition-transform"
            >
              Start shopping
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}
      </section>
      
      {/* Bottom Spacer */}
      <div className="h-10" />
    </div>
  );
}
