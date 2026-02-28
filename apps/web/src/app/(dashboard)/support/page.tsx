"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export default function SupportDashboardPage() {
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => apiClient.get("/admin/orders"),
  });

  const { data: merchants, isLoading: isLoadingMerchants } = useQuery({
    queryKey: ["admin", "merchants", "pending"],
    queryFn: () => apiClient.get("/admin/merchants/pending"),
  });

  const orderCount = Array.isArray(orders) ? orders.length : 0;
  const merchantCount = Array.isArray(merchants) ? merchants.length : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-navy-dark dark:text-white">
          Support Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          View-only access to orders and merchant profiles for customer support.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/support/orders"
          className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Total Orders
              </p>
              <p className="text-3xl font-black text-navy-dark dark:text-white mt-1">
                {isLoadingOrders ? "..." : orderCount}
              </p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 text-2xl">
                local_shipping
              </span>
            </div>
          </div>
          <p className="text-xs font-bold text-blue-500 mt-3 uppercase tracking-wider group-hover:underline">
            View Orders →
          </p>
        </Link>

        <Link
          href="/support/merchants"
          className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Merchants
              </p>
              <p className="text-3xl font-black text-navy-dark dark:text-white mt-1">
                {isLoadingMerchants ? "..." : merchantCount}
              </p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 text-2xl">
                storefront
              </span>
            </div>
          </div>
          <p className="text-xs font-bold text-blue-500 mt-3 uppercase tracking-wider group-hover:underline">
            View Merchants →
          </p>
        </Link>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-500 mt-0.5">
          info
        </span>
        <div>
          <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
            Read-Only Access
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">
            Your account has view-only permissions. Contact an Operator or Super
            Admin if you need to take actions on orders or merchants.
          </p>
        </div>
      </div>
    </div>
  );
}
