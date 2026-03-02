"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface PendingMerchant {
  id: string;
  businessName: string;
  businessType: string | null;
  category: string | null;
  businessAddress: string | null;
  cacNumber: string | null;
  createdAt: string;
  user: { email: string; firstName: string; lastName: string; phone: string };
}

export default function SupportMerchantsPage() {
  const { data: merchants, isLoading } = useQuery<PendingMerchant[]>({
    queryKey: ["admin", "merchants", "pending"],
    queryFn: () => apiClient.get("/admin/merchants/pending"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-navy-dark dark:text-white">
          Merchants
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          View-only list of merchant profiles for customer support reference.
        </p>
      </div>

      {!merchants || merchants.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">
            storefront
          </span>
          <p className="mt-4 text-slate-500 font-bold">
            No merchants to display.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {merchants.map((m) => (
            <div
              key={m.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6"
            >
              <h3 className="font-black text-navy-dark dark:text-white text-lg">
                {m.businessName}
              </h3>
              {m.user.firstName} {m.user.lastName} • {m.user.email} •{" "}
              {m.user.phone}
              <div className="flex flex-wrap gap-2 mt-2">
                {m.category && (
                  <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-bold text-slate-600 dark:text-slate-400">
                    {m.category}
                  </span>
                )}
                {m.businessAddress && (
                  <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-bold text-slate-600 dark:text-slate-400">
                    {m.businessAddress}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
