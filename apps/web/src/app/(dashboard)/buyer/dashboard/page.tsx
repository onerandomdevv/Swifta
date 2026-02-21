"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKobo } from "@hardware-os/shared";
import { getMyRFQs } from "@/lib/api/rfq.api";
import { getOrders } from "@/lib/api/order.api";
import type { RFQ, Order } from "@hardware-os/shared";

export default function BuyerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [rfqData, orderData] = await Promise.all([
          getMyRFQs(1, 100) as unknown as Promise<RFQ[]>,
          getOrders(1, 100) as unknown as Promise<Order[]>,
        ]);
        setRfqs(Array.isArray(rfqData) ? rfqData : []);
        setOrders(Array.isArray(orderData) ? orderData : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeRfqCount = rfqs.filter((r) => r.status === "OPEN" || r.status === "QUOTED").length;
  const pendingPayments = orders
    .filter((o) => o.status === "PENDING_PAYMENT")
    .reduce((sum, o) => sum + BigInt(o.totalAmountKobo || 0), 0n);
  const pendingPaymentCount = orders.filter((o) => o.status === "PENDING_PAYMENT").length;
  const totalOrders = orders.length;
  const inTransit = orders.filter((o) => o.status === "DISPATCHED").length;

  const kpis = [
    {
      label: "Active RFQs",
      value: String(activeRfqCount),
      trend: `${rfqs.length} total`,
      trendType: "up" as const,
      icon: "description",
      subtext: `${rfqs.filter((r) => r.status === "OPEN").length} awaiting responses`,
    },
    {
      label: "Pending Payments",
      value: formatKobo(pendingPayments),
      badge: pendingPaymentCount > 0 ? `${pendingPaymentCount} OUTSTANDING` : undefined,
      icon: "account_balance_wallet",
      subtext: pendingPaymentCount > 0 ? "Action required" : "All clear",
    },
    {
      label: "Total Orders",
      value: String(totalOrders),
      trend: `${inTransit} in transit`,
      trendType: "up" as const,
      icon: "local_shipping",
      subtext: `${inTransit} currently in transit`,
    },
  ];

  const quickLinks = [
    {
      label: "Create New RFQ",
      sub: "Request quotes for new hardware",
      icon: "add_box",
      color: "bg-navy-dark",
      textColor: "text-white",
    },
    {
      label: "Browse Catalogue",
      sub: "View verified items",
      icon: "storefront",
      color: "bg-white",
      textColor: "text-navy-dark",
    },
    {
      label: "Verified Suppliers",
      sub: "Connect with local Lagos dealers",
      icon: "verified",
      color: "bg-white",
      textColor: "text-navy-dark",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-96 rounded-xl" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-8">
            <Skeleton className="h-8 w-32" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-3xl" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-8 space-y-8">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-[2.5rem]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400 mb-4">error</span>
        <p className="text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  // Build recent activity from real orders
  const recentOrders = orders.slice(0, 4);
  const activities = recentOrders.map((order) => {
    const statusMap: Record<string, { title: string; icon: string; iconColor: string; bg: string }> = {
      PENDING_PAYMENT: { title: "Payment Required", icon: "payments", iconColor: "text-amber-500", bg: "bg-amber-50/50" },
      PAID: { title: "Payment Confirmed", icon: "check_circle", iconColor: "text-emerald-500", bg: "bg-emerald-50/50" },
      DISPATCHED: { title: "Order Shipped", icon: "local_shipping", iconColor: "text-blue-500", bg: "bg-blue-50/50" },
      COMPLETED: { title: "Order Delivered", icon: "verified", iconColor: "text-emerald-500", bg: "bg-emerald-50/50" },
      CANCELLED: { title: "Order Cancelled", icon: "cancel", iconColor: "text-red-500", bg: "bg-red-50/50" },
    };
    const info = statusMap[order.status] || { title: order.status, icon: "info", iconColor: "text-slate-400", bg: "bg-slate-50/50" };
    return {
      ...info,
      orderId: order.id,
      desc: `Order #${order.id.slice(0, 8)} — ${formatKobo(BigInt(order.totalAmountKobo))}`,
      time: new Date(order.createdAt).toLocaleDateString(),
    };
  });

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
            Buyer Dashboard Overview
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
            Manage your hardware procurement and marketplace activity in Lagos.
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all duration-500"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <span className="material-symbols-outlined font-black">
                  {kpi.icon}
                </span>
              </div>
              {kpi.trend && (
                <span
                  className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${kpi.trendType === "up" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}
                >
                  {kpi.trend}
                </span>
              )}
              {kpi.badge && (
                <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 rounded-full">
                  {kpi.badge}
                </span>
              )}
            </div>

            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
              {kpi.label}
            </p>
            <h3 className="text-4xl font-black text-navy-dark dark:text-white tracking-tighter uppercase leading-none">
              {kpi.value}
            </h3>

            <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {kpi.subtext}
              </p>
              {idx === 0 && (
                <Link
                  href="/buyer/rfqs"
                  className="text-[9px] font-black text-navy-dark dark:text-white uppercase tracking-widest hover:underline"
                >
                  View List
                </Link>
              )}
              {idx === 2 && (
                <Link
                  href="/buyer/orders"
                  className="text-[9px] font-black text-navy-dark dark:text-white uppercase tracking-widest hover:underline"
                >
                  Order History
                </Link>
              )}
            </div>

            {idx === 1 && pendingPaymentCount > 0 && (
              <div className="absolute bottom-0 left-0 h-1 bg-amber-500 w-[65%]"></div>
            )}
          </div>
        ))}
      </div>

      {/* Main Grid: Quick Links & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Quick Links */}
        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-navy-dark dark:text-white font-black">
              electric_bolt
            </span>
            <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
              Quick Links
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-5">
            {quickLinks.map((link, idx) => {
              const href =
                idx === 0
                  ? "/buyer/rfqs/new"
                  : idx === 1
                    ? "/buyer/catalogue"
                    : "/buyer/suppliers";
              return (
                <Link
                  key={idx}
                  href={href}
                  className={`${link.color} ${link.textColor} p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex items-center gap-6`}
                >
                  <div
                    className={`size-14 rounded-2xl ${link.color === "bg-white" ? "bg-slate-50 dark:bg-slate-800" : "bg-white/10"} flex items-center justify-center`}
                  >
                    <span className="material-symbols-outlined text-2xl font-black">
                      {link.icon}
                    </span>
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-widest mb-1">
                      {link.label}
                    </p>
                    <p
                      className={`${link.color === "bg-white" ? "text-slate-500" : "text-white/60"} text-[10px] font-bold uppercase tracking-tight`}
                    >
                      {link.sub}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Marketplace Tips Box */}
          <div className="bg-navy-dark rounded-3xl p-8 text-white relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
                Marketplace Tips
              </p>
              <h4 className="text-lg font-black leading-tight uppercase">
                Get better rates by bundling RFQs for similar materials.
              </h4>
            </div>
            <div className="absolute -bottom-10 -right-10 size-40 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-[2s]"></div>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-navy-dark dark:text-white font-black">
                history
              </span>
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
                Recent Activity
              </h3>
            </div>
            <Link href="/buyer/orders" className="text-[10px] font-black text-slate-400 hover:text-navy-dark dark:hover:text-white uppercase tracking-widest transition-colors">
              View All
            </Link>
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">inbox</span>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No recent activity</p>
            </div>
          ) : (
            <div className="relative pl-0 sm:pl-8 space-y-10">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800 hidden sm:block"></div>

              {activities.map((activity, idx) => (
                <div key={idx} className="relative group">
                  <div
                    className={`absolute -left-[45px] top-0 size-8 rounded-full ${activity.bg} dark:bg-slate-900 border-2 border-white dark:border-slate-950 items-center justify-center z-10 group-hover:scale-110 transition-transform hidden sm:flex`}
                  >
                    <span
                      className={`material-symbols-outlined text-lg font-black ${activity.iconColor}`}
                    >
                      {activity.icon}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 border border-slate-50 dark:border-slate-800 shadow-sm group-hover:shadow-xl transition-all">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                      <h4 className="font-black text-navy-dark dark:text-white text-sm uppercase tracking-widest">
                        {activity.title}
                      </h4>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {activity.time}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold leading-relaxed mb-6 uppercase tracking-tight opacity-80">
                      {activity.desc}
                    </p>

                    <Link
                      href={`/buyer/orders/${activity.orderId}`}
                      className="px-6 py-2.5 bg-navy-dark text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-navy-dark/10 active:scale-95 transition-all text-center inline-block"
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
