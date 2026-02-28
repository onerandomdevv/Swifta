"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/button";

interface PayoutRequest {
  id: string;
  amountKobo: number;
  status: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
  merchantProfile: {
    businessName: string;
    user: {
      email: string;
      phone: string;
    };
  };
}

export default function AdminPayoutsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(
    null,
  );

  const { data: payouts, isLoading } = useQuery<PayoutRequest[]>({
    queryKey: ["admin", "payouts", "pending"],
    queryFn: () => apiClient.get("/admin/payouts"),
  });

  const processMutation = useMutation({
    mutationFn: (payoutId: string) =>
      apiClient.patch(`/admin/payouts/${payoutId}/process`, {}),
    onSuccess: () => {
      toast.success("Payout marked as PROCESSED successfully.");
      queryClient.invalidateQueries({
        queryKey: ["admin", "payouts", "pending"],
      });
      setSelectedPayout(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to process payout.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-neon-cyan">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in mt-4 fade-in slide-in-from-bottom-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-navy-dark dark:text-white uppercase tracking-widest">
            Payout Requests
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">
            Review and process immediate merchant withdrawals
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-neon-cyan/10 text-neon-cyan font-bold px-4 py-2.5 rounded-xl text-sm border-2 border-neon-cyan/20">
            <span className="mr-2 text-navy-dark dark:text-slate-300">
              Pending Requests:
            </span>
            {payouts?.length || 0}
          </div>
        </div>
      </header>

      {/* Main Table View */}
      <section className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden">
        {payouts && payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-100 dark:border-slate-800">
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Merchant Details
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Amount
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Routing Information
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Date Requested
                  </th>
                  <th className="p-4 md:p-6 text-right text-xs font-black uppercase tracking-widest text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr
                    key={payout.id}
                    className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group cursor-pointer"
                    onClick={() => setSelectedPayout(payout)}
                  >
                    <td className="p-4 md:p-6">
                      <p className="font-bold text-navy-dark dark:text-white group-hover:text-neon-cyan transition-colors">
                        {payout.merchantProfile?.businessName || "N/A"}
                      </p>
                      <p className="text-xs font-bold text-slate-500 mt-1">
                        {payout.merchantProfile.user.email}
                      </p>
                    </td>
                    <td className="p-4 md:p-6">
                      <p className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                        ₦{(payout.amountKobo / 100).toLocaleString()}
                      </p>
                    </td>
                    <td className="p-4 md:p-6">
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300 line-clamp-1">
                        {payout.accountName || "Unknown Account"}
                      </p>
                      <p className="text-xs text-slate-500 font-bold uppercase mt-1">
                        {payout.bankName} • {payout.accountNumber}
                      </p>
                    </td>
                    <td className="p-4 md:p-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                        {new Date(payout.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4 md:p-6 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-neon-cyan hover:bg-neon-cyan/10 font-bold tracking-wider uppercase text-xs"
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4">
              task_alt
            </span>
            <p className="text-lg font-bold text-navy-dark dark:text-white">
              No Pending Payouts
            </p>
            <p className="text-sm font-medium text-slate-500 mt-2">
              All merchant withdrawal requests have been processed.
            </p>
          </div>
        )}
      </section>

      {/* Review Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8">
            <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10">
              <h2 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-widest">
                Process Withdrawal
              </h2>
              <button
                onClick={() => setSelectedPayout(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                disabled={processMutation.isPending}
              >
                <span className="material-symbols-outlined text-slate-400">
                  close
                </span>
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              {/* Core Info */}
              <div className="text-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Requested Amount
                </span>
                <span className="text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  ₦{(selectedPayout.amountKobo / 100).toLocaleString()}
                </span>
              </div>

              {/* Merchant Details */}
              <div>
                <h3 className="text-xs font-black text-neon-cyan uppercase tracking-widest mb-4">
                  Merchant Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Business Name
                    </span>
                    <span className="font-bold text-navy-dark dark:text-white">
                      {selectedPayout.merchantProfile?.businessName || "N/A"}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Contact Phone
                    </span>
                    <span className="font-bold text-navy-dark dark:text-white">
                      {selectedPayout.merchantProfile.user.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Routing Information */}
              <div>
                <h3 className="text-xs font-black text-brand uppercase tracking-widest mb-4">
                  Wire Transfer Details
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Destination Bank
                      </span>
                      <span className="font-bold text-navy-dark dark:text-white text-lg">
                        {selectedPayout.bankName}
                      </span>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 w-full"></div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Account Name
                      </span>
                      <span className="font-bold text-navy-dark dark:text-white tracking-wide">
                        {selectedPayout.accountName || "---"}
                      </span>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 w-full"></div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Account Number
                      </span>
                      <span className="font-black text-neon-cyan tracking-widest text-xl">
                        {selectedPayout.accountNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500 rounded-r-xl">
                <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
                  <span className="material-symbols-outlined inline-block align-middle mr-2 text-lg">
                    warning
                  </span>
                  Disburse funds to the account above before marking this
                  request as PROCESSED.
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-4 justify-end rounded-b-[2rem]">
              <Button
                variant="outline"
                className="w-full md:w-auto h-12 text-sm font-black tracking-widest uppercase hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setSelectedPayout(null)}
                disabled={processMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="w-full md:w-auto h-12 text-sm font-black tracking-widest uppercase bg-neon-cyan hover:bg-[#00e5ff] text-navy-dark shadow-lg shadow-neon-cyan/20"
                onClick={() => processMutation.mutate(selectedPayout.id)}
                disabled={processMutation.isPending}
              >
                {processMutation.isPending
                  ? "Processing..."
                  : "Mark as Processed"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
