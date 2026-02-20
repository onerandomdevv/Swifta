"use client";

import React from "react";
import Link from "next/link";
import { formatKobo } from "@hardware-os/shared";

export default function MerchantOrdersPage() {
  const stats = [
    {
      label: "Total Active Orders",
      value: "1,284",
      trend: "+12.5%",
      trendColor: "text-emerald-600",
    },
    {
      label: "Pending Payment",
      value: "42",
      badge: "High Alert",
      badgeColor: "bg-amber-100 text-amber-700",
    },
    {
      label: "Ready for Dispatch",
      value: "15",
      trend: "Steady",
      trendColor: "text-slate-500",
    },
    {
      label: "Revenue (Today)",
      value: formatKobo(248000000n),
      trend: "+18.2%",
      trendColor: "text-emerald-600",
    },
  ];

  const orders = [
    {
      id: "ORD-9023",
      customer: "Ikeja Construction Ltd",
      location: "Ikeja, Lagos",
      date: "Oct 24, 2023",
      amount: 125000000n,
      status: "PENDING_PAYMENT",
    },
    {
      id: "ORD-9024",
      customer: "Alaba Mega Tools",
      location: "Ojo, Lagos",
      date: "Oct 23, 2023",
      amount: 45020000n,
      status: "PAID",
    },
    {
      id: "ORD-9025",
      customer: "Lekki Industrial Base",
      location: "Lekki Phase 1, Lagos",
      date: "Oct 23, 2023",
      amount: 280000000n,
      status: "DISPATCHED",
    },
    {
      id: "ORD-9026",
      customer: "Mainland Hardware Hub",
      location: "Yaba, Lagos",
      date: "Oct 22, 2023",
      amount: 11500000n,
      status: "COMPLETED",
    },
    {
      id: "ORD-9027",
      customer: "Surulere BuildCo",
      location: "Surulere, Lagos",
      date: "Oct 22, 2023",
      amount: 8950000n,
      status: "COMPLETED",
    },
    {
      id: "ORD-9028",
      customer: "Apapa Port Suppliers",
      location: "Apapa, Lagos",
      date: "Oct 21, 2023",
      amount: 342000000n,
      status: "PENDING_PAYMENT",
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Page Content */}
      <main className="flex-1 space-y-8 py-8 px-4 md:px-10">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
              Orders Management
            </h1>
            <p className="text-slate-500 font-bold text-sm tracking-wide mt-2 uppercase opacity-70">
              Manage and track your B2B hardware trades across Lagos districts.
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-sm">
            <span className="material-symbols-outlined text-lg">download</span>
            Export CSV
          </button>
        </div>

        {/* Top KPI Metrics Header Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                {stat.label}
              </p>
              <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-black text-navy-dark dark:text-white tracking-tight leading-none uppercase">
                  {stat.value}
                </h3>
                {stat.trend && (
                  <span
                    className={`text-[9px] font-black tracking-widest ${stat.trendColor}`}
                  >
                    {stat.trend}
                  </span>
                )}
              </div>
              {stat.badge && (
                <div className="mt-4">
                  <span
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${stat.badgeColor}`}
                  >
                    {stat.badge}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Content Section: Tabs & List */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-navy-dark/5 overflow-hidden">
          {/* List Toolbar / Filters */}
          <div className="px-8 py-5 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
              {["All Orders", "Pending", "Paid", "Dispatched", "Completed"].map(
                (tab, i) => (
                  <button
                    key={tab}
                    className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${i === 0 ? "bg-navy-dark text-white shadow-lg" : "text-slate-400 hover:text-navy-dark dark:hover:text-white"}`}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>

            <button className="flex items-center gap-2 px-6 py-3 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
              <span className="material-symbols-outlined text-lg">
                filter_list
              </span>
              More Filters
            </button>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Order ID
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Customer & Location
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Order Date
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Amount (₦)
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Status
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {orders.map((order, idx) => (
                  <tr
                    key={idx}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300"
                  >
                    <td className="px-8 py-8">
                      <p className="text-sm font-black text-navy-dark dark:text-white uppercase leading-tight">
                        #{order.id}
                      </p>
                    </td>
                    <td className="px-8 py-8">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-navy-dark dark:text-white">
                          {order.customer}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {order.location}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                        {order.date}
                      </p>
                    </td>
                    <td className="px-8 py-8">
                      <p className="text-sm font-black text-navy-dark dark:text-white tracking-tight">
                        {formatKobo(order.amount)}
                      </p>
                    </td>
                    <td className="px-8 py-8">
                      <span
                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border h-7 ${
                          order.status === "PENDING_PAYMENT"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : order.status === "PAID"
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : order.status === "DISPATCHED"
                                ? "bg-purple-50 text-purple-700 border-purple-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <Link
                        href={`/merchant/orders/${order.id}`}
                        className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-navy-dark dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all active:scale-95 inline-block"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Data Table Footer / Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-0">
              Showing{" "}
              <span className="text-navy-dark dark:text-white">1-6</span> of{" "}
              <span className="text-navy-dark dark:text-white">
                1,284 orders
              </span>
            </p>
            <div className="flex items-center gap-4">
              <button
                className="p-2.5 rounded-xl border-2 border-slate-50 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                disabled
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, "...", 42].map((pg, i) => (
                  <button
                    key={i}
                    className={`size-9 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${pg === 1 ? "bg-navy-dark text-white" : "text-slate-400 hover:text-navy-dark"}`}
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

        {/* Global Footer (Internal) */}
        <div className="pt-8 pb-4 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
            © 2023 Hardware OS Lagos • Secured B2B Trading Platform
          </p>
        </div>
      </main>
    </div>
  );
}
