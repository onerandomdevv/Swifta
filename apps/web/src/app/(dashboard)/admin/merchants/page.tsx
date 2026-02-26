"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/button";

interface UserInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface PendingMerchant {
  id: string;
  businessName: string;
  businessType: string | null;
  category: string | null;
  businessAddress: string | null;
  cacNumber: string | null;
  cacDocumentUrl: string | null;
  warehouseLocation: string | null;
  bankCode: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  createdAt: string;
  user: UserInfo;
}

export default function AdminMerchantsQueuePage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedMerchant, setSelectedMerchant] =
    useState<PendingMerchant | null>(null);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");

  const { data: merchants, isLoading } = useQuery<PendingMerchant[]>({
    queryKey: ["admin", "merchants", "pending"],
    queryFn: () => apiClient.get("/admin/merchants/pending"),
  });

  const broadcastMutation = useMutation({
    mutationFn: (message: string) =>
      apiClient.post("/admin/broadcast", { message }),
    onSuccess: (res: any) => {
      toast.success(
        `Broadcast sent successfully to ${res.deliveredTo} merchants.`,
      );
      setIsBroadcastModalOpen(false);
      setBroadcastMsg("");
    },
    onError: () => {
      toast.error("Failed to broadcast message.");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (merchantId: string) =>
      apiClient.patch(`/admin/merchants/${merchantId}/verify`, {}),
    onSuccess: () => {
      toast.success("Merchant has been verified and approved successfully.");
      queryClient.invalidateQueries({
        queryKey: ["admin", "merchants", "pending"],
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setSelectedMerchant(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to verify merchant.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (merchantId: string) =>
      apiClient.patch(`/admin/merchants/${merchantId}/reject`, {}),
    onSuccess: () => {
      toast.success("Merchant application has been rejected.");
      queryClient.invalidateQueries({
        queryKey: ["admin", "merchants", "pending"],
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setSelectedMerchant(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to reject merchant.");
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
            Verification Queue
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">
            Review and approve pending merchant applications
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsBroadcastModalOpen(true)}
            className="bg-brand text-navy-dark hover:bg-neon-cyan px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              campaign
            </span>
            Broadcast Message
          </button>
          <div className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold px-4 py-2.5 rounded-xl text-sm border-2 border-orange-100 dark:border-orange-900">
            <span className="mr-2">Pending Review:</span>
            {merchants?.length || 0}
          </div>
        </div>
      </header>

      {/* Main Table View */}
      <section className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden">
        {merchants && merchants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-100 dark:border-slate-800">
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Business Details
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Contact
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Bank Context
                  </th>
                  <th className="p-4 md:p-6 text-xs font-black uppercase tracking-widest text-slate-400">
                    Registration
                  </th>
                  <th className="p-4 md:p-6 text-right text-xs font-black uppercase tracking-widest text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((merchant) => (
                  <tr
                    key={merchant.id}
                    className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group cursor-pointer"
                    onClick={() => setSelectedMerchant(merchant)}
                  >
                    <td className="p-4 md:p-6">
                      <p className="font-bold text-navy-dark dark:text-white group-hover:text-brand transition-colors">
                        {merchant.businessName}
                      </p>
                      <p className="text-xs font-bold text-slate-500 uppercase mt-1">
                        {merchant.category || "General"} •{" "}
                        {merchant.businessType || "Retail"}
                      </p>
                    </td>
                    <td className="p-4 md:p-6">
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                        {merchant.user.firstName || merchant.user.lastName
                          ? `${merchant.user.firstName} ${merchant.user.lastName}`
                          : "N/A"}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {merchant.user.email} <br /> {merchant.user.phone}
                      </p>
                    </td>
                    <td className="p-4 md:p-6">
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300 relative line-clamp-1">
                        {merchant.bankAccountName || "Awaiting Setup"}
                      </p>
                      <p className="text-xs text-slate-500 font-bold uppercase">
                        {merchant.bankCode || "XXX"} •{" "}
                        {merchant.bankAccountNo || "XXXXX"}
                      </p>
                    </td>
                    <td className="p-4 md:p-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                        {new Date(merchant.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4 md:p-6 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-brand hover:bg-brand/10 font-bold tracking-wider uppercase text-xs"
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
              check_circle
            </span>
            <p className="text-lg font-bold text-navy-dark dark:text-white">
              Queue is empty
            </p>
            <p className="text-sm font-medium text-slate-500 mt-2">
              All merchant applications have been processed.
            </p>
          </div>
        )}
      </section>

      {/* Review Modal */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8">
            <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10">
              <h2 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-widest">
                Merchant Review
              </h2>
              <button
                onClick={() => setSelectedMerchant(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                disabled={verifyMutation.isPending || rejectMutation.isPending}
              >
                <span className="material-symbols-outlined text-slate-400">
                  close
                </span>
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              {/* Core Info */}
              <div>
                <h3 className="text-xs font-black text-neon-cyan uppercase tracking-widest mb-4">
                  Company Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Business Name
                    </span>
                    <span className="font-bold text-navy-dark dark:text-white">
                      {selectedMerchant.businessName}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      CAC Number
                    </span>
                    <span className="font-bold text-navy-dark dark:text-white">
                      {selectedMerchant.cacNumber || "Missing"}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 md:col-span-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Registered Address
                    </span>
                    <span className="font-bold text-navy-dark dark:text-white">
                      {selectedMerchant.businessAddress || "Missing"}
                    </span>
                  </div>
                </div>
              </div>

              {/* CAC Document */}
              <div>
                <h3 className="text-xs font-black text-brand uppercase tracking-widest mb-4">
                  Official Documentation
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-brand">
                        description
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-navy-dark dark:text-white">
                        CAC Certificate
                      </p>
                      <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">
                        {selectedMerchant.cacDocumentUrl
                          ? "Document Uploaded"
                          : "Missing File"}
                      </p>
                    </div>
                  </div>
                  {selectedMerchant.cacDocumentUrl ? (
                    <a
                      href={selectedMerchant.cacDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-navy-dark text-xs font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity"
                    >
                      View File
                    </a>
                  ) : (
                    <span className="px-3 py-1 bg-red-50 text-red-500 rounded-md text-xs font-bold uppercase">
                      Unverifiable
                    </span>
                  )}
                </div>
              </div>

              {/* Financials */}
              <div>
                <h3 className="text-xs font-black text-green-500 uppercase tracking-widest mb-4">
                  Payout Routing
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-green-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-500">
                        account_balance
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        Verified Bank Account
                      </p>
                      <p className="font-black text-navy-dark dark:text-white">
                        {selectedMerchant.bankAccountName || "Pending"}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        CODE: {selectedMerchant.bankCode || "---"} • ACC:{" "}
                        {selectedMerchant.bankAccountNo || "---"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row gap-4 justify-end rounded-b-[2rem]">
              <Button
                variant="outline"
                className="w-full md:w-auto h-12 text-sm font-black tracking-widest uppercase border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={() => rejectMutation.mutate(selectedMerchant.id)}
                disabled={verifyMutation.isPending || rejectMutation.isPending}
              >
                {rejectMutation.isPending
                  ? "Rejecting..."
                  : "Reject Application"}
              </Button>
              <Button
                className="w-full md:w-auto h-12 text-sm font-black tracking-widest uppercase bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20"
                onClick={() => verifyMutation.mutate(selectedMerchant.id)}
                disabled={
                  verifyMutation.isPending ||
                  rejectMutation.isPending ||
                  !selectedMerchant.cacDocumentUrl ||
                  !selectedMerchant.bankAccountNo
                }
              >
                {verifyMutation.isPending ? "Approving..." : "Approve Merchant"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">
                  campaign
                </span>
                Broadcast Message
              </h2>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                disabled={broadcastMutation.isPending}
              >
                <span className="material-symbols-outlined text-slate-400">
                  close
                </span>
              </button>
            </div>

            <p className="text-sm font-bold text-slate-500 mb-6">
              This message will be instantly submitted to all{" "}
              <span className="text-green-500">VERIFIED</span> merchants via
              email/in-app notifications.
            </p>

            <textarea
              className="w-full h-32 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium focus:outline-none focus:border-brand transition-colors resize-none mb-6 text-navy-dark dark:text-white"
              placeholder="Type your platform-wide announcement here..."
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              disabled={broadcastMutation.isPending}
            />

            <div className="flex justify-end gap-4">
              <Button
                variant="ghost"
                className="font-bold tracking-widest uppercase hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                onClick={() => setIsBroadcastModalOpen(false)}
                disabled={broadcastMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="bg-brand hover:bg-neon-cyan text-navy-dark font-black tracking-widest uppercase shadow-lg shadow-brand/20 px-6"
                onClick={() => broadcastMutation.mutate(broadcastMsg)}
                disabled={!broadcastMsg.trim() || broadcastMutation.isPending}
              >
                {broadcastMutation.isPending
                  ? "Transmitting..."
                  : "Send to All"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
