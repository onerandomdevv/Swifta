"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useNotifications } from "@/hooks/use-notifications";

export function MerchantHeader({
  onOpenNotifications,
}: {
  onOpenNotifications: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(
        `/merchant/orders?search=${encodeURIComponent(searchQuery.trim())}`,
      );
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 flex-shrink-0">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm transition-all outline-none"
            placeholder="Search RFQs, products, or buyers..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={onOpenNotifications}
          className="relative text-slate-500 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
          )}
        </button>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none group-hover:text-primary transition-colors">
              {user?.fullName || user?.email?.split("@")[0] || "Merchant"}
            </p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">
              {user?.merchantId ? "Verified Merchant" : "Pending Profile"}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-primary/20 transition-all shadow-sm flex items-center justify-center bg-gradient-to-br from-primary to-blue-600 text-white font-bold text-lg">
            {user?.fullName
              ? user.fullName[0].toUpperCase()
              : user?.email
                ? user.email[0].toUpperCase()
                : "M"}
          </div>
        </div>
      </div>
    </header>
  );
}
