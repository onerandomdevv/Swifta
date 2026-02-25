"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useNotifications } from "@/hooks/use-notifications";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/lib/api/merchant.api";
import { useMerchantDashboard } from "@/hooks/use-merchant-data";
import { formatKobo } from "@hardware-os/shared";

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

  const { orders } = useMerchantDashboard();

  const escrowBalance = orders
    .filter((o) => o.status === "PAID" || o.status === "DISPATCHED")
    .reduce((sum, o) => sum + BigInt(o.totalAmountKobo || 0), 0n);

  const verificationStatus = profile?.verification || "UNVERIFIED";

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded text-sm pl-10 focus:ring-1 focus:ring-primary h-9 outline-none text-slate-900 dark:text-white placeholder:text-slate-500"
            placeholder="Search orders, SKU, or merchant ID..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 px-4 h-10 flex items-center gap-3 rounded">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-tight">
            Escrow Balance
          </span>
          <span className="text-primary font-bold text-base leading-none tabular-nums">
            {formatKobo(escrowBalance)}
          </span>
        </div>

        <button
          onClick={onOpenNotifications}
          className="relative size-10 flex items-center justify-center rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">
            notifications
          </span>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => router.push("/merchant/products/new")}
          className="bg-primary text-white h-10 px-4 rounded text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Listing
        </button>
      </div>
    </header>
  );
}
