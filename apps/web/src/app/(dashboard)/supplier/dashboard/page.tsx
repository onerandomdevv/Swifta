"use client";

import { useAuth } from "@/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { getDisplayName } from "@hardware-os/shared";

export default function SupplierDashboardPage() {
  const { user } = useAuth();

  // We'll add a hook for supplier stats later
  // const { data: stats } = useQuery({ ... });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Supplier Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Welcome back, {getDisplayName(user) || "Supplier"}. Manage your
            wholesale operations here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Account Status
            </span>
            <span className="flex items-center gap-1.5 text-sm font-bold text-amber-500">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Verification
            </span>
          </div>
        </div>
      </div>

      {/* Stats Overview Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Wholesale Products",
            value: "-",
            icon: "inventory_2",
          },
          { label: "Merchant Orders", value: "-", icon: "shopping_cart" },
          { label: "Active Quotations", value: "-", icon: "request_quote" },
          {
            label: "Total Revenue (Excl. Escrow)",
            value: "₦0.00",
            icon: "payments",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {stat.value}
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Info Card for new Suppliers */}
      <div className="p-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex flex-col md:flex-row items-center gap-6">
        <div className="size-16 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
          <span className="material-symbols-outlined text-3xl">info</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">
            Setting up your Wholesale Catalogue
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm font-medium leading-relaxed">
            As a supplier, your products are only visible to verified merchants
            on SwiftTrade. Start by adding your manufacturer-grade stock and
            specify minimum order quantities (MOQ).
          </p>
        </div>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md">
          Learn More
        </button>
      </div>

      {/* Placeholder for Recent Orders/Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Recent Merchant Orders
            </h3>
            <button className="text-primary text-xs font-bold uppercase tracking-wider hover:underline">
              View All
            </button>
          </div>
          <div className="p-12 text-center">
            <p className="text-sm text-slate-400 font-medium italic">
              No orders yet. They will appear here once merchants start buying
              your stock.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Active Listings
            </h3>
            <button className="text-primary text-xs font-bold uppercase tracking-wider hover:underline">
              Manage Items
            </button>
          </div>
          <div className="p-12 text-center">
            <p className="text-sm text-slate-400 font-medium italic">
              You haven't listed any wholesale products yet.
            </p>
            <button className="mt-4 text-primary text-sm font-bold flex items-center gap-1 mx-auto hover:underline">
              <span className="material-symbols-outlined text-base">add</span>
              Add First Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
