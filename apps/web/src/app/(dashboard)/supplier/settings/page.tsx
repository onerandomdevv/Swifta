"use client";

import { useAuth } from "@/providers/auth-provider";
import { getDisplayName } from "@hardware-os/shared";

export default function SupplierSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Supplier Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Manage your manufacturing company details and account preferences.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white">
            Company Profile
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            This information is shown to merchants when they view your products.
          </p>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Company Name
              </label>
              <p className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-bold border border-slate-100 dark:border-slate-700">
                {user?.supplierProfile?.companyName || "Not Set"}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                CAC Number
              </label>
              <p className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-bold border border-slate-100 dark:border-slate-700">
                {user?.supplierProfile?.cacNumber || "Not Set"}
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Company Address
            </label>
            <p className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-bold border border-slate-100 dark:border-slate-700">
              {user?.supplierProfile?.companyAddress || "Not Set"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white">
            Account Security
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage your personal details and password.
          </p>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Full Name
              </label>
              <p className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-bold border border-slate-100 dark:border-slate-700">
                {getDisplayName(user) || "Not Set"}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Email Address
              </label>
              <p className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-bold border border-slate-100 dark:border-slate-700">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
