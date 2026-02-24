"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export default function OperatorDashboardPage() {
  const { data: pending, isLoading: isLoadingPending } = useQuery({
    queryKey: ["admin", "merchants", "pending"],
    queryFn: () => apiClient.get("/admin/merchants/pending"),
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => apiClient.get("/admin/orders"),
  });

  const pendingCount = Array.isArray(pending) ? pending.length : 0;
  const orderCount = Array.isArray(orders) ? orders.length : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-navy-dark dark:text-white">
          Operator Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Manage merchant verifications and order resolutions.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/operator/merchants"
          className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-600 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Pending Verifications
              </p>
              <p className="text-3xl font-black text-navy-dark dark:text-white mt-1">
                {isLoadingPending ? "..." : pendingCount}
              </p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-500 text-2xl">
                storefront
              </span>
            </div>
          </div>
          <p className="text-xs font-bold text-orange-500 mt-3 uppercase tracking-wider group-hover:underline">
            Review Merchants →
          </p>
        </Link>

        <Link
          href="/operator/orders"
          className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-600 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Active Orders
              </p>
              <p className="text-3xl font-black text-navy-dark dark:text-white mt-1">
                {isLoadingOrders ? "..." : orderCount}
              </p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-500 text-2xl">
                local_shipping
              </span>
            </div>
          </div>
          <p className="text-xs font-bold text-orange-500 mt-3 uppercase tracking-wider group-hover:underline">
            Manage Orders →
          </p>
        </Link>
      </div>
    </div>
  );
}
