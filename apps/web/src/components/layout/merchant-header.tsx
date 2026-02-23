"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useNotifications } from "@/hooks/use-notifications";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/lib/api/merchant.api";

export function MerchantHeader({
  onOpenNotifications,
}: {
  onOpenNotifications: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotifications(true, true);

  const { data: profile } = useQuery({
    queryKey: ["merchant", "profile"],
    queryFn: getProfile,
    enabled: !!user?.merchantId,
  });

  const verificationStatus = profile?.verification || "UNVERIFIED";


  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 flex-shrink-0">
      <div className="flex-1"></div>

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
              {verificationStatus === "VERIFIED" 
                ? "Verified Merchant" 
                : `Status: ${verificationStatus}`}
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
