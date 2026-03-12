"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useNotifications } from "@/hooks/use-notifications";
import { useQuery } from "@tanstack/react-query";
import { merchantApi } from "@/lib/api/merchant.api";
import { useMerchantDashboard } from "@/hooks/use-merchant-data";
import { formatKobo } from "@hardware-os/shared";

export function MerchantHeader({
  onOpenNotifications,
  onMenuClick,
}: {
  onOpenNotifications: () => void;
  onMenuClick?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotifications(true, true);

  const { data: profile } = useQuery({
    queryKey: ["merchant", "profile"],
    queryFn: () => merchantApi.getProfile(),
    enabled: !!user?.merchantId,
  });

  const { orders } = useMerchantDashboard();

  const escrowBalance = orders
    .filter((o) => o.status === "PAID" || o.status === "DISPATCHED")
    .reduce((sum, o) => sum + BigInt(o.totalAmountKobo || 0), 0n);

  return (
    <header className="h-16 lg:h-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-40">
      <div className="flex items-center gap-3 flex-1 lg:max-w-xl">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="relative w-full hidden sm:block max-w-sm lg:max-w-none">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded text-sm pl-10 focus:ring-1 focus:ring-primary h-9 outline-none text-slate-900 dark:text-white placeholder:text-slate-500"
            placeholder="Search orders, SKU..."
            type="text"
          />
        </div>

        <div className="sm:hidden text-lg font-black text-primary uppercase tracking-tight leading-none">
          SwiftTrade
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <div className="hidden md:flex bg-primary/5 dark:bg-primary/10 border border-primary/20 px-3 lg:px-4 h-9 lg:h-10 items-center gap-2 lg:gap-3 rounded">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-tight hidden lg:block">
            Escrow Balance
          </span>
          <span className="text-primary font-bold text-sm lg:text-base leading-none tabular-nums">
            {formatKobo(escrowBalance)}
          </span>
        </div>

        <button
          onClick={onOpenNotifications}
          className="relative size-9 lg:size-10 flex items-center justify-center rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-xl">
            notifications
          </span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => router.push("/merchant/products/new")}
          className="bg-primary text-white h-9 lg:h-10 px-3 lg:px-4 rounded text-[11px] lg:text-sm font-bold flex items-center gap-1.5 lg:gap-2 hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-base lg:text-lg">
            add
          </span>
          <span className="hidden sm:inline">New Listing</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </header>
  );
}
