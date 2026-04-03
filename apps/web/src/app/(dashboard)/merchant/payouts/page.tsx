"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatKobo } from "@/lib/utils";
import { getOrders, getOrderSummary } from "@/lib/api/order.api";
import { merchantApi } from "@/lib/api/merchant.api";
import { useToast } from "@/providers/toast-provider";
import { OrderStatus, VerificationTier } from "@twizrr/shared";
import type { Order } from "@twizrr/shared";

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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          SUCCESS
        </span>
      );
    case OrderStatus.PAID:
    case OrderStatus.DISPATCHED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          IN ESCROW
        </span>
      );
    case OrderStatus.CANCELLED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          REFUNDED
        </span>
      );
    case OrderStatus.DISPUTE:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          DISPUTE
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
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

  // Auto-resolve account name
  React.useEffect(() => {
    if (formBankCode && formAccountNo.length === 10) {
      setIsResolving(true);
      setResolveError("");

      merchantApi
        .resolveBankAccount(formAccountNo, formBankCode)
        .then((data) => {
          setFormAccountName(data.accountName);
          setIsResolving(false);
        })
        .catch(() => {
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

  const filteredBanks = banksList.filter((bank) =>
    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()),
  );

  const hasBankInfo = !!(profile as any)?.bankAccountNumber;
  const bankName = resolveBankName((profile as any)?.bankCode, banksList);
  const accountNo = maskAccountNo((profile as any)?.bankAccountNumber);
  const accountName = (profile as any)?.settlementAccountName || "Not configured";
  const isVerified =
    (profile as any)?.verificationTier === VerificationTier.TIER_2 ||
    (profile as any)?.verificationTier === VerificationTier.TIER_3;

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

    merchantApi
      .requestPayout({ amount: Number(summary.escrow) })
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

  const ledgerOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (isLoading) {
    return (
      <div className="h-full bg-background-light dark:bg-background-dark p-8 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading payouts...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full bg-background-light dark:bg-background-dark p-8 flex flex-col items-center justify-center space-y-4 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <p className="text-red-500 font-bold">Failed to load payout data</p>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display text-slate-900 dark:text-slate-100">
      <div className="flex flex-col lg:flex-row">
        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Header */}
          <header className="p-4 md:p-8 pb-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Payouts & Settlement</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Track your earnings, manage bank details, and request payouts.</p>
          </header>

          {/* KPI Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-8 py-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                </div>
              </div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Escrow Balance</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatKobo(summary?.escrow ?? 0)}</h3>
              <p className="text-slate-400 text-sm mt-1">Balance in transition</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">verified_user</span>
                </div>
              </div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Paid Out</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatKobo(summary?.paidOut ?? 0)}</h3>
              <p className="text-emerald-500 text-sm mt-1">Payouts healthy</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">schedule</span>
                </div>
              </div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Pending Approval</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatKobo(summary?.pending ?? 0)}</h3>
              <p className="text-amber-500 text-sm mt-1">Orders awaiting approval</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
                </div>
              </div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Failed / Disputed</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatKobo(summary?.failed ?? 0)}</h3>
              {(summary?.failed ?? 0) > 0 && (
                <p className="text-red-500 text-sm mt-1 font-medium">Requires attention</p>
              )}
            </div>
          </section>

          {/* Transaction Ledger */}
          <section className="px-4 md:px-8 py-6 flex-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Transaction Ledger</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-sm font-semibold transition-colors">
                  <span className="material-symbols-outlined text-sm">download</span>
                  Export CSV
                </button>
              </div>

              {ledgerOrders.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order Ref</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {ledgerOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-primary font-semibold whitespace-nowrap">
                              {order.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                              {/* Payout is what the merchant receives (Total - Platform Fee) */}
                              {formatKobo(
                                Number(order.totalAmountKobo) - Number(order.platformFeeKobo || 0),
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(order.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Showing {ledgerOrders.length} transactions
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-16 text-center flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-slate-300">payments</span>
                  <p className="text-slate-500 font-medium text-sm">
                    No payouts yet. Complete your first delivery to receive your first payout.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-[380px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 lg:p-8 flex flex-col gap-6 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto shrink-0">
          {/* Settlement Account */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Settlement Account</h3>

            {hasBankInfo && !isEditingBank ? (
              <>
                {/* Bank Card */}
                <div className="p-5 rounded-2xl bg-[#0f172a] text-white relative overflow-hidden shadow-lg">
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2 px-2 py-1 bg-primary/20 border border-primary/30 rounded text-[10px] text-primary font-bold uppercase tracking-tight">
                        <span className="material-symbols-outlined text-[12px] font-bold">verified</span>
                        {isVerified ? "Verified" : "Configured"}
                      </div>
                      <span className="material-symbols-outlined text-slate-400">credit_card</span>
                    </div>
                    <h4 className="text-lg font-bold">{bankName}</h4>
                    <p className="text-slate-400 text-sm font-mono tracking-widest mt-1">{accountNo}</p>
                    <div className="mt-6 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Account Holder</p>
                        <p className="text-sm font-semibold">{accountName}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleEditClick}
                  className="inline-flex items-center gap-2 text-primary text-sm font-bold hover:underline"
                >
                  Update Settlement Details
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </>
            ) : isEditingBank ? (
              /* Edit Bank Form */
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-4">
                <form onSubmit={handleUpdateBank} className="space-y-4">
                  <div className="relative" ref={bankDropdownRef}>
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Bank</label>
                    <input
                      type="text"
                      value={bankSearchQuery}
                      onChange={(e) => {
                        setBankSearchQuery(e.target.value);
                        setFormBankCode("");
                        setIsBankDropdownOpen(true);
                      }}
                      onFocus={() => setIsBankDropdownOpen(true)}
                      placeholder={isLoadingBanks ? "Loading banks..." : "Search bank..."}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                      disabled={isLoadingBanks}
                    />
                    {isBankDropdownOpen && !isLoadingBanks && (
                      <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-xl">
                        {filteredBanks.length > 0 ? (
                          filteredBanks.map((bank) => (
                            <li
                              key={bank.code}
                              onClick={() => {
                                setFormBankCode(bank.code);
                                setBankSearchQuery(bank.name);
                                setIsBankDropdownOpen(false);
                              }}
                              className="p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              {bank.name}
                            </li>
                          ))
                        ) : (
                          <li className="p-3 text-sm text-slate-500 italic">No banks found</li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formAccountNo}
                      onChange={(e) => setFormAccountNo(e.target.value)}
                      required
                      maxLength={10}
                      placeholder="0123456789"
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Account Name</label>
                    <input
                      type="text"
                      value={formAccountName}
                      readOnly
                      placeholder={isResolving ? "Resolving name..." : "Auto-filled from bank"}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-white"
                    />
                    {resolveError && (
                      <p className="text-xs text-red-500 mt-1 font-bold">{resolveError}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingBank(false)}
                      className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateBankMutation.isPending || isResolving || !formAccountName}
                      className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* No Bank Configured */
              <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center space-y-3">
                <span className="material-symbols-outlined text-3xl text-slate-300">account_balance</span>
                <p className="text-sm text-slate-500">Add your bank details to receive payouts.</p>
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Add Bank Details
                </button>
              </div>
            )}
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Payout Schedule */}
          <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-2xl border border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <span className="material-symbols-outlined text-base">event_repeat</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Payout Schedule</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Automatic payouts are processed when a buyer confirms delivery via OTP. Funds are transferred to your settlement account within 24 hours.
            </p>
            <button
              onClick={handleRequestPayout}
              disabled={isRequestingPayout || !hasBankInfo}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRequestingPayout ? "Requesting..." : "Request Immediate Payout"}
              {!isRequestingPayout && <span className="material-symbols-outlined text-lg">bolt</span>}
            </button>
          </div>

          {/* System Status */}
          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">All payment gateways operational</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">security</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">2-Factor Authentication</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded uppercase">On</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
