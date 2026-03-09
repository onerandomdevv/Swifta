"use client";

import { useAuth } from "@/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { getDisplayName } from "@hardware-os/shared";

export default function SupplierDashboardPage() {
  const { user } = useAuth();

  // We'll add a hook for supplier stats later
  // const { data: stats } = useQuery({ ... });

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-700 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Supplier Dashboard
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium leading-tight">
            Welcome back, {getDisplayName(user) || "Supplier"}. Manage your
            wholesale operations here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col sm:items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Account Status
            </span>
            <span className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-500 uppercase tracking-tight">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Verification
            </span>
          </div>
        </div>
      </div>

      {/* Stats Overview Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          {
            label: "Total Wholesale Products",
            value: "-",
            icon: "inventory_2",
          },
          { label: "Merchant Orders", value: "-", icon: "shopping_cart" },
          { label: "Active Quotations", value: "-", icon: "request_quote" },
          {
            label: "Total Revenue",
            value: "₦0.00",
            icon: "payments",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1">
              {stat.value}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Info Card for new Suppliers */}
      <div className="p-6 sm:p-8 bg-primary/5 border border-primary/10 rounded-2xl flex flex-col md:flex-row items-center gap-6">
        <div className="size-14 sm:size-16 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-3xl">info</span>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
            Setting up your Wholesale Catalogue
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-2xl mx-auto md:mx-0">
            As a supplier, your products are only visible to verified merchants
            on SwiftTrade. Start by adding your manufacturer-grade stock and
            specify minimum order quantities (MOQ).
          </p>
        </div>
        <button className="w-full md:w-auto px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-black rounded-xl transition-all shadow-lg shadow-primary/20 text-sm uppercase tracking-widest">
          Learn More
        </button>
      </div>

      {/* Placeholder for Recent Orders/Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 min-h-[400px]">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">
              Recent Merchant Orders
            </h3>
            <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
              View All
            </button>
          </div>
          <div className="flex-1 p-10 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
              <span className="material-symbols-outlined text-slate-300 text-3xl">
                receipt_long
              </span>
            </div>
            <p className="text-sm text-slate-400 font-bold italic max-w-[200px]">
              No orders yet. They will appear here once merchants start buying
              your stock.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">
              Active Listings
            </h3>
            <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
              Manage Items
            </button>
          </div>
          <div className="flex-1 p-10 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
              <span className="material-symbols-outlined text-slate-300 text-3xl">
                inventory_2
              </span>
            </div>
            <p className="text-sm text-slate-400 font-bold italic max-w-[200px] mb-4">
              You haven't listed any wholesale products yet.
            </p>
            <button className="bg-primary/10 text-primary px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
              <span className="material-symbols-outlined text-base">add</span>
              Add First Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
