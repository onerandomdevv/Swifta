"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatKobo } from "@/lib/utils";

interface AdminStats {
  totalMerchants: number;
  verifiedMerchants: number;
  pendingMerchants: number;
  totalBuyers: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenueKobo: number | bigint;
}


interface SystemAlert {
  id: string;
  type: "CRITICAL" | "WARNING";
  title: string;
  message: string;
  actionLink: string;
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading: isLoadingStats } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => apiClient.get("/admin/stats"),
  });

  const { data: payouts } = useQuery<any[]>({
    queryKey: ["admin", "payouts", "pending"],
    queryFn: () => apiClient.get("/admin/payouts"),
  });

  const { data: alerts, isLoading: isLoadingAlerts } = useQuery<SystemAlert[]>({
    queryKey: ["admin", "alerts"],
    queryFn: () => apiClient.get("/admin/alerts"),
  });

  if (isLoadingStats || isLoadingAlerts) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-neon-cyan">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in mt-2 sm:mt-4 fade-in slide-in-from-bottom-4 px-2 sm:px-0">
      <header>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-navy-dark dark:text-white uppercase tracking-widest leading-tight">
          Platform Overview
        </h1>
        <p className="text-[10px] sm:text-sm font-bold text-slate-500 mt-1 uppercase tracking-[0.15em]">
          Global Metrics & Activity Rollup
        </p>
      </header>

      {/* System Warning Overlay */}
      {alerts && alerts.length > 0 && (
        <section className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 rounded-2xl border-l-[6px] shadow-sm ${
                alert.type === "CRITICAL"
                  ? "bg-red-50 dark:bg-red-900/10 border-red-500"
                  : "bg-orange-50 dark:bg-orange-900/10 border-orange-500"
              }`}
            >
              <div className="flex items-start gap-4 flex-1">
                <span
                  className={`material-symbols-outlined mt-0.5 ${alert.type === "CRITICAL" ? "text-red-500" : "text-orange-500"}`}
                >
                  warning
                </span>
                <div>
                  <h4
                    className={`font-black text-xs sm:text-sm uppercase tracking-widest ${alert.type === "CRITICAL" ? "text-red-700 dark:text-red-400" : "text-orange-700 dark:text-orange-400"}`}
                  >
                    {alert.title}
                  </h4>
                  <p
                    className={`text-xs sm:text-sm mt-1 font-medium leading-relaxed ${alert.type === "CRITICAL" ? "text-red-600 dark:text-red-300" : "text-orange-600 dark:text-orange-300"}`}
                  >
                    {alert.message}
                  </p>
                </div>
              </div>
              <Link
                href={alert.actionLink}
                className={`mt-4 sm:mt-0 px-6 py-3 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center ${
                  alert.type === "CRITICAL"
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30"
                }`}
              >
                Take Action
              </Link>
            </div>
          ))}
        </section>
      )}

      {/* KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Block */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:border-brand/30 transition-all active:scale-[0.98]">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Total Accounts
            </h3>
            <span className="material-symbols-outlined text-brand bg-brand/10 p-2 rounded-xl">
              group
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-navy-dark dark:text-white mt-4">
            {stats?.totalUsers || 0}
          </p>
        </div>

        {/* Merchants Block */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:border-neon-cyan/30 transition-all active:scale-[0.98]">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Active Merchants
            </h3>
            <span className="material-symbols-outlined text-neon-cyan bg-neon-cyan/10 p-2 rounded-xl">
              storefront
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-navy-dark dark:text-white mt-4">
            {stats?.totalMerchants || 0}
          </p>
          <div className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-wider flex items-center gap-2">
            <span className="text-green-500">
              {stats?.verifiedMerchants || 0} VERIFIED
            </span>
            <span className="text-slate-200">|</span>
            <span className="text-orange-500">
              {stats?.pendingMerchants || 0} PENDING
            </span>
          </div>
        </div>

        {/* Orders Block */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:border-orange-500/30 transition-all active:scale-[0.98]">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Total Orders
            </h3>
            <span className="material-symbols-outlined text-orange-500 bg-orange-50 dark:bg-orange-900/10 p-2 rounded-xl">
              receipt_long
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-navy-dark dark:text-white mt-4">
            {stats?.totalOrders || 0}
          </p>
        </div>

        {/* Revenue Block */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:border-green-500/30 transition-all active:scale-[0.98]">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Platform Volume
            </h3>
            <span className="material-symbols-outlined text-green-500 bg-green-50 dark:bg-green-900/10 p-2 rounded-xl">
              account_balance_wallet
            </span>
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-navy-dark dark:text-white mt-4 truncate">
            {formatKobo(stats?.totalRevenueKobo ?? 0)}
          </p>
        </div>
      </section>

      {/* Action Center */}
      <section className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm p-6 sm:p-8">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">
          Action Center
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Link
            href="/admin/merchants"
            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-orange-900/5 transition-all group active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-orange-500 bg-orange-100 dark:bg-orange-900/20 p-3.5 rounded-xl group-hover:scale-110 transition-transform">
                how_to_reg
              </span>
              <div>
                <h4 className="font-black text-navy-dark dark:text-white uppercase tracking-wider text-sm">
                  Verification
                </h4>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Process {stats?.pendingMerchants || 0} new merchants
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100">
              <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                {stats?.pendingMerchants || 0} WAITING
              </span>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all">
                arrow_forward
              </span>
            </div>
          </Link>

          <Link
            href="/admin/payouts"
            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-neon-cyan/50 hover:bg-neon-cyan/5 dark:hover:bg-neon-cyan/5 transition-all group active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-neon-cyan bg-neon-cyan/10 p-3.5 rounded-xl group-hover:scale-110 transition-transform">
                account_balance
              </span>
              <div>
                <h4 className="font-black text-navy-dark dark:text-white uppercase tracking-wider text-sm">
                  Payouts
                </h4>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Process escrow disbursements
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100">
              <span className="bg-neon-cyan text-deep-blue text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                {payouts?.length || 0} PENDING
              </span>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-neon-cyan group-hover:translate-x-1 transition-all">
                arrow_forward
              </span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
