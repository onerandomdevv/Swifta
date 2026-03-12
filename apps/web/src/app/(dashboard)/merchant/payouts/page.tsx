"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatKobo } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrders, getOrderSummary } from "@/lib/api/order.api";
import { merchantApi } from "@/lib/api/merchant.api";
import { useToast } from "@/providers/toast-provider";
import { OrderStatus } from "@hardware-os/shared";
import type { Order } from "@hardware-os/shared";

function resolveBankName(
  code?: string | null,
  banksList: { code: string; name: string }[] = [],
): string {
  if (!code) return "Not configured";
  const bank = banksList.find((b) => b.code === code);
  return bank ? bank.name : `Bank (${code})`;
}

function maskAccountNo(acct?: string | null): string {
  if (!acct || acct.length < 4) return "****";
  return acct.slice(0, 3) + "****" + acct.slice(-3);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case OrderStatus.COMPLETED:
    case OrderStatus.DELIVERED:
      return (
        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
          SUCCESS
        </span>
      );
    case OrderStatus.PAID:
    case OrderStatus.DISPATCHED:
      return (
        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold uppercase border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
          IN ESCROW
        </span>
      );
    case OrderStatus.CANCELLED:
      return (
        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
          REFUNDED
        </span>
      );
    case OrderStatus.DISPUTE:
      return (
        <span className="bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold uppercase border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
          DISPUTE
        </span>
      );
    default:
      return (
        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold uppercase border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
          PENDING
        </span>
      );
  }
}

export default function MerchantPayoutsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [formBankCode, setFormBankCode] = useState("");
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [formAccountNo, setFormAccountNo] = useState("");
  const [formAccountName, setFormAccountName] = useState("");
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const bankDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        bankDropdownRef.current &&
        !bankDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBankDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-resolve account name when bank code and account number criteria are met
  React.useEffect(() => {
    if (formBankCode && formAccountNo.length === 10) {
      setIsResolving(true);
      setResolveError("");

      merchantApi.resolveBankAccount(formAccountNo, formBankCode)
        .then((data) => {
          setFormAccountName(data.accountName);
          setIsResolving(false);
        })
        .catch((err) => {
          setResolveError("Account resolution failed. Please check details.");
          setFormAccountName("");
          setIsResolving(false);
        });
    } else {
      setFormAccountName("");
      setResolveError("");
    }
  }, [formBankCode, formAccountNo]);

  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery<Order[]>({
    queryKey: ["merchant-orders-payouts"],
    queryFn: () => getOrders(1, 100),
  });

  const { data: summary } = useQuery({
    queryKey: ["merchant-order-summary"],
    queryFn: getOrderSummary,
  });

  const { data: profile } = useQuery({
    queryKey: ["merchant-profile"],
    queryFn: merchantApi.getProfile,
  });

  const { data: banksList = [], isLoading: isLoadingBanks } = useQuery({
    queryKey: ["merchant-banks"],
    queryFn: merchantApi.getBanks,
  });

  // Filter banks based on search query
  const filteredBanks = banksList.filter((bank) =>
    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()),
  );

  const hasBankInfo = !!(profile as any)?.bankAccountNumber;
  const bankName = resolveBankName((profile as any)?.bankCode, banksList);
  const accountNo = maskAccountNo((profile as any)?.bankAccountNumber);
  const accountName =
    (profile as any)?.settlementAccountName || "Not configured";
  const businessName = (profile as any)?.businessName || "Merchant";
  const isVerified =
    (profile as any)?.verificationTier === "VERIFIED" ||
    (profile as any)?.verificationTier === "TRUSTED";

  const updateBankMutation = useMutation({
    mutationFn: (data: { bankCode: string; bankAccountNo: string }) =>
      merchantApi.updateBankAccount({
        bankCode: data.bankCode,
        bankAccountNumber: data.bankAccountNo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-profile"] });
      setIsEditingBank(false);
      toast.success("Bank details updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update bank details");
      console.error(err);
    },
  });

  const handleUpdateBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBankCode || !formAccountNo || !formAccountName) return;
    updateBankMutation.mutate({
      bankCode: formBankCode,
      bankAccountNo: formAccountNo,
    });
  };

  const handleEditClick = () => {
    const currentCode = (profile as any)?.bankCode || "";
    setFormBankCode(currentCode);
    setBankSearchQuery(
      currentCode && banksList
        ? banksList.find((b) => b.code === currentCode)?.name || ""
        : "",
    );
    setFormAccountNo((profile as any)?.bankAccountNo || "");
    setFormAccountName((profile as any)?.bankAccountName || "");
    setIsEditingBank(true);
  };

  const handleRequestPayout = () => {
    if (!summary?.escrow || summary.escrow <= 0) {
      toast.error("No escrow balance available for payout.");
      return;
    }
    setIsRequestingPayout(true);

    merchantApi.requestPayout({ amount: Number(summary.escrow) })
      .then(() => {
        toast.success(
          "Payout request submitted! Funds will be transferred within 24 hours.",
        );
      })
      .catch((err) => {
        toast.error(
          err?.message || "Failed to submit payout request. Please try again.",
        );
      })
      .finally(() => {
        setIsRequestingPayout(false);
      });
  };

  // All orders sorted by date (most recent first) for the ledger
  const ledgerOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (isLoading) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 lg:p-8 flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
        <div className="flex-1 space-y-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32 w-full rounded" />
            <Skeleton className="h-32 w-full rounded" />
            <Skeleton className="h-32 w-full rounded" />
            <Skeleton className="h-32 w-full rounded" />
          </div>
          <Skeleton className="h-[400px] w-full rounded" />
        </div>
        <aside className="w-full lg:w-96 shrink-0 space-y-6">
          <Skeleton className="h-64 w-full rounded" />
          <Skeleton className="h-48 w-full rounded" />
        </aside>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-4">
            error
          </span>
          <p className="text-red-500 font-bold">Failed to load payout data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ═══════════ Left Content: Dashboard & Ledger ═══════════ */}
      <div className="flex-1 p-6 lg:p-8 space-y-8 overflow-y-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Escrow */}
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Escrow Balance
              </p>
              <span className="material-symbols-outlined text-primary">
                account_balance_wallet
              </span>
            </div>
            <p className="text-3xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
              {formatKobo(summary?.escrow ?? 0)}
            </p>
            <div className="mt-2 flex items-center gap-1 text-slate-500">
              <span className="text-xs font-bold">Balance in transition</span>
            </div>
          </div>

          {/* Paid Out */}
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Paid Out
              </p>
              <span className="material-symbols-outlined text-emerald-500">
                verified_user
              </span>
            </div>
            <p className="text-3xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
              {formatKobo(summary?.paidOut ?? 0)}
            </p>
            <div className="mt-2 flex items-center gap-1 text-emerald-600">
              <span className="material-symbols-outlined text-sm">
                check_circle
              </span>
              <span className="text-xs font-bold">Payouts healthy</span>
            </div>
          </div>

          {/* Pending */}
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pending Approval
              </p>
              <span className="material-symbols-outlined text-amber-500">
                schedule
              </span>
            </div>
            <p className="text-3xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
              {formatKobo(summary?.pending ?? 0)}
            </p>
            <div className="mt-2 flex items-center gap-1 text-slate-500">
              <span className="text-xs font-bold">
                Orders awaiting approval
              </span>
            </div>
          </div>

          {/* Failed */}
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Failed / Disputed
              </p>
              <span className="material-symbols-outlined text-red-500">
                error
              </span>
            </div>
            <p className="text-3xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
              {formatKobo(summary?.failed ?? 0)}
            </p>
            {summary?.failed && summary.failed > 0 && (
              <div className="mt-2 flex items-center gap-1 text-red-600">
                <span className="text-xs font-bold">Requires attention</span>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════ Transaction Ledger Table ═══════════ */}
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">
              Transaction Ledger
            </h3>
            <button className="flex items-center gap-2 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 uppercase tracking-widest text-slate-700 dark:text-slate-300">
              <span className="material-symbols-outlined text-sm">
                download
              </span>{" "}
              Export CSV
            </button>
          </div>

          {ledgerOrders.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                        Date
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                        Order Ref
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ledgerOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-sm font-mono text-primary whitespace-nowrap">
                          {order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-white">
                          {formatKobo(
                            Number(order.totalAmountKobo) +
                              Number(order.deliveryFeeKobo),
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Showing {ledgerOrders.length} transactions
                </span>
              </div>
            </>
          ) : (
            <div className="p-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">
                payments
              </span>
              <p className="text-slate-500 font-medium text-sm">
                No payouts yet. Complete your first delivery to receive your
                first payout.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ Right Sidebar: Settlement ═══════════ */}
      <aside className="w-full border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-6 lg:w-96 shrink-0 overflow-y-auto">
        <div className="space-y-6 lg:sticky lg:top-0">
          {/* Settlement Account Card */}
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`h-10 w-10 flex items-center justify-center border ${hasBankInfo ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800" : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-800"}`}
              >
                <span className="material-symbols-outlined">
                  {hasBankInfo ? "verified_user" : "warning"}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Settlement Account
                </h4>
                <p
                  className={`text-[10px] font-bold uppercase ${hasBankInfo ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {hasBankInfo
                    ? isVerified
                      ? "Verified & Active"
                      : "Configured"
                    : "Not Configured"}
                </p>
              </div>
            </div>

            {hasBankInfo && !isEditingBank ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                    Bank Name
                  </label>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {bankName}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                    Account Number
                  </label>
                  <p className="text-sm font-mono tracking-widest text-slate-800 dark:text-slate-200">
                    {accountNo}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                    Account Name
                  </label>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {accountName}
                  </p>
                </div>
              </div>
            ) : isEditingBank ? (
              <form onSubmit={handleUpdateBank} className="space-y-4 pt-2">
                <div className="relative" ref={bankDropdownRef}>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block mb-1">
                    Bank
                  </label>
                  <input
                    type="text"
                    value={bankSearchQuery}
                    onChange={(e) => {
                      setBankSearchQuery(e.target.value);
                      setFormBankCode(""); // Reset code if they change the text
                      setIsBankDropdownOpen(true);
                    }}
                    onFocus={() => setIsBankDropdownOpen(true)}
                    placeholder={
                      isLoadingBanks ? "Loading banks..." : "Search bank..."
                    }
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2 text-sm text-slate-900 dark:text-white"
                    disabled={isLoadingBanks}
                  />
                  {isBankDropdownOpen && !isLoadingBanks && (
                    <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
                      {filteredBanks.length > 0 ? (
                        filteredBanks.map((bank) => (
                          <li
                            key={bank.code}
                            onClick={() => {
                              setFormBankCode(bank.code);
                              setBankSearchQuery(bank.name);
                              setIsBankDropdownOpen(false);
                            }}
                            className="p-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            {bank.name}
                          </li>
                        ))
                      ) : (
                        <li className="p-2 text-sm text-slate-500 italic">
                          No banks found
                        </li>
                      )}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formAccountNo}
                    onChange={(e) => setFormAccountNo(e.target.value)}
                    required
                    maxLength={10}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={formAccountName}
                    readOnly
                    placeholder={
                      isResolving
                        ? "Resolving name..."
                        : "Auto-filled from bank"
                    }
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2 text-sm text-slate-900 dark:text-white disabled:opacity-50"
                  />
                  {resolveError && (
                    <p className="text-[10px] text-red-500 mt-1 font-bold">
                      {resolveError}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingBank(false)}
                    className="flex-1 border border-slate-200 dark:border-slate-800 p-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      updateBankMutation.isPending ||
                      isResolving ||
                      !formAccountName
                    }
                    className="flex-1 bg-primary text-white p-2 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4">
                <span className="material-symbols-outlined text-3xl text-slate-300 mb-2 block">
                  account_balance
                </span>
                <p className="text-xs text-slate-500 mb-3">
                  Add your bank details here to receive payouts.
                </p>
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="inline-block bg-primary text-white text-xs font-bold uppercase tracking-widest px-6 py-2.5 hover:bg-primary/90 transition-colors"
                >
                  Add Bank Details
                </button>
              </div>
            )}

            {hasBankInfo && !isEditingBank && (
              <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between items-center">
                <button
                  onClick={handleEditClick}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    settings
                  </span>{" "}
                  Update Account
                </button>
                <span className="text-[10px] font-bold text-slate-400">
                  {isVerified ? "VERIFIED" : "PENDING"}
                </span>
              </div>
            )}
          </div>

          {/* Payout Schedule */}
          <div className="border border-slate-200 dark:border-slate-800 bg-primary/5 dark:bg-primary/10 p-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
              Payout Schedule
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Payouts are processed automatically when a buyer confirms delivery
              via the OTP code. Funds are transferred to your settlement account
              within 24 hours.
            </p>
            <button
              onClick={handleRequestPayout}
              disabled={isRequestingPayout || !hasBankInfo}
              className="w-full bg-primary py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRequestingPayout
                ? "Requesting..."
                : "Request Immediate Payout"}
            </button>
          </div>

          {/* System Status */}
          <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              All payment gateways operational
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
