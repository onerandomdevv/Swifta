"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/button";

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

export default function OperatorMerchantsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: merchants, isLoading } = useQuery<PendingMerchant[]>({
    queryKey: ["admin", "merchants", "pending"],
    queryFn: () => apiClient.get("/admin/merchants/pending"),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.patch(`/admin/merchants/${id}/verify`, {}),
    onSuccess: () => {
      toast.success("Merchant verified successfully.");
      queryClient.invalidateQueries({
        queryKey: ["admin", "merchants", "pending"],
      });
    },
    onError: (err: any) => toast.error(err?.message || "Verification failed."),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.patch(`/admin/merchants/${id}/reject`, {}),
    onSuccess: () => {
      toast.success("Merchant rejected.");
      queryClient.invalidateQueries({
        queryKey: ["admin", "merchants", "pending"],
      });
    },
    onError: (err: any) => toast.error(err?.message || "Rejection failed."),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-orange-500">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-navy-dark dark:text-white">
          Merchant Verification
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Review and verify or reject pending merchant applications.
        </p>
      </div>

      {!merchants || merchants.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">
            verified
          </span>
          <p className="mt-4 text-slate-500 font-bold">
            No pending verifications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {merchants.map((m) => (
            <div
              key={m.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-black text-navy-dark dark:text-white text-lg">
                    {m.businessName}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {m.user.firstName} {m.user.lastName} • {m.user.email}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {m.category && (
                      <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-bold text-slate-600 dark:text-slate-400">
                        {m.category}
                      </span>
                    )}
                    {m.cacNumber && (
                      <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-bold text-slate-600 dark:text-slate-400">
                        CAC: {m.cacNumber}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white font-bold tracking-wider uppercase text-xs"
                    onClick={() => verifyMutation.mutate(m.id)}
                    disabled={verifyMutation.isPending}
                  >
                    <span className="material-symbols-outlined text-[16px] mr-1">
                      check_circle
                    </span>
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold tracking-wider uppercase text-xs"
                    onClick={() => rejectMutation.mutate(m.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <span className="material-symbols-outlined text-[16px] mr-1">
                      cancel
                    </span>
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
