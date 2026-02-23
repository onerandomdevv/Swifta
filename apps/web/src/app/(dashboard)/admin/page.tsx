"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface AdminStats {
  totalMerchants: number;
  verifiedMerchants: number;
  pendingMerchants: number;
  totalBuyers: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenueKobo: number;
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
    <div className="space-y-8 animate-in mt-4 fade-in slide-in-from-bottom-4">
      <header>
        <h1 className="text-2xl md:text-3xl font-black text-navy-dark dark:text-white uppercase tracking-widest">
          Platform Overview
        </h1>
        <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">
          Global Metrics & Activity Rollup
        </p>
      </header>

      {/* System Warning Overlay */}
      {alerts && alerts.length > 0 && (
        <section className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border-l-4 shadow-sm ${
                alert.type === "CRITICAL"
                  ? "bg-red-50 dark:bg-red-900/10 border-red-500"
                  : "bg-orange-50 dark:bg-orange-900/10 border-orange-500"
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`material-symbols-outlined mt-1 ${alert.type === "CRITICAL" ? "text-red-500" : "text-orange-500"}`}
                >
                  warning
                </span>
                <div>
                  <h4
                    className={`font-black text-sm uppercase tracking-widest ${alert.type === "CRITICAL" ? "text-red-700 dark:text-red-400" : "text-orange-700 dark:text-orange-400"}`}
                  >
                    {alert.title}
                  </h4>
                  <p
                    className={`text-sm mt-1 font-medium ${alert.type === "CRITICAL" ? "text-red-600 dark:text-red-300" : "text-orange-600 dark:text-orange-300"}`}
                  >
                    {alert.message}
                  </p>
                </div>
              </div>
              <Link
                href={alert.actionLink}
                className={`mt-4 sm:mt-0 shrink-0 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors ${
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
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Block */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm transform transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Total Accounts
            </h3>
            <span className="material-symbols-outlined text-brand bg-brand/10 p-2 rounded-full">
              group
            </span>
          </div>
          <p className="text-4xl font-black text-navy-dark dark:text-white mt-4">
            {stats?.totalUsers || 0}
          </p>
        </div>

        {/* Merchants Block */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm transform transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Active Merchants
            </h3>
            <span className="material-symbols-outlined text-neon-cyan bg-neon-cyan/10 p-2 rounded-full">
              storefront
            </span>
          </div>
          <p className="text-4xl font-black text-navy-dark dark:text-white mt-4">
            {stats?.totalMerchants || 0}
          </p>
          <p className="text-xs font-bold text-slate-500 mt-2">
            <span className="text-green-500">
              {stats?.verifiedMerchants || 0}
            </span>{" "}
            Verified •{" "}
            <span className="text-orange-500">
              {stats?.pendingMerchants || 0}
            </span>{" "}
            Pending
          </p>
        </div>

        {/* Orders Block */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm transform transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Total Orders
            </h3>
            <span className="material-symbols-outlined text-orange-500 bg-orange-50 p-2 rounded-full">
              receipt_long
            </span>
          </div>
          <p className="text-4xl font-black text-navy-dark dark:text-white mt-4">
            {stats?.totalOrders || 0}
          </p>
        </div>

        {/* Revenue Block */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm transform transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Platform Volume
            </h3>
            <span className="material-symbols-outlined text-green-500 bg-green-50 p-2 rounded-full">
              account_balance_wallet
            </span>
          </div>
          <p className="text-4xl font-black text-navy-dark dark:text-white mt-4">
            ₦{((stats?.totalRevenueKobo || 0) / 100).toLocaleString()}
          </p>
        </div>
      </section>

      {/* Placeholder for Quick Actions */}
      <section className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm p-8">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">
          Action Center
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
          <span className="material-symbols-outlined text-6xl mb-4 opacity-50">
            build
          </span>
          <p className="font-bold text-sm uppercase tracking-wider">
            Merchant Approval Queue Under Construction
          </p>
        </div>
      </section>
    </div>
  );
}
