"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { getProfile } from "@/lib/api/merchant.api";

export default function MerchantVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await getProfile();
        setProfile(response);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
        <div className="space-y-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-12 w-96 rounded-xl" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-64 w-full rounded-[2rem]" />
          <Skeleton className="h-64 w-full rounded-[2rem]" />
        </div>
      </div>
    );
  }

  const {
    businessName,
    cacNumber,
    taxId,
    bankCode,
    bankAccountNo,
    bankAccountName,
    verification,
    onboardingStep,
  } = profile || {};

  const getBankName = (code: string) => {
    const banks = {
      "044": "Access Bank",
      "023": "Citibank Nigeria",
      "063": "Diamond Bank",
      "050": "Ecobank Nigeria",
      "084": "Enterprise Bank",
      "070": "Fidelity Bank",
      "011": "First Bank of Nigeria",
      "214": "First City Monument Bank",
      "058": "Guaranty Trust Bank",
      "030": "Heritage Bank",
      "301": "Jaiz Bank",
      "082": "Keystone Bank",
      "526": "Parallex Bank",
      "076": "Polaris Bank",
      "101": "Providus Bank",
      "221": "Stanbic IBTC Bank",
      "068": "Standard Chartered Bank",
      "232": "Sterling Bank",
      "100": "Suntrust Bank",
      "032": "Union Bank of Nigeria",
      "033": "United Bank for Africa",
      "215": "Unity Bank",
      "035": "Wema Bank",
      "057": "Zenith Bank",
    } as Record<string, string>;
    return banks[code] || code || "Not Provided";
  };

  const isIncomplete =
    !profile || onboardingStep < 5 || !cacNumber || !bankAccountNo;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
            Merchant KYC Verification
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide">
            Secure your merchant account to enable trade payouts and higher
            limits.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Merchant Status
          </p>
          <StatusBadge
            status={verification || "UNVERIFIED"}
            className="px-5 py-2"
          />
        </div>
      </div>

      {isIncomplete ? (
        <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-100 dark:border-amber-900/20 rounded-[2rem] p-8 text-center space-y-6">
          <div className="size-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-tight">
              Onboarding Incomplete
            </h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto font-medium leading-relaxed">
              You must complete your business profile, including bank details
              and KYC documents, before your account can be verified for trading
              and payouts.
            </p>
          </div>
          <Link
            href="/merchant/onboarding"
            className="inline-block px-8 py-4 bg-navy-dark dark:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all active:scale-95"
          >
            Complete Onboarding Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* 1. Identity Verification Display */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-navy-dark text-white flex items-center justify-center font-black text-xs shadow-lg shadow-navy-dark/20 text-blue-400">
                  01
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
                    Business Identity
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                    Official business registration details
                  </p>
                </div>
              </div>
              <StatusBadge status={verification || "PENDING"} />
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-6 md:pb-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Business Name
                  </p>
                  <p className="font-bold text-navy-dark dark:text-white">
                    {businessName || "Not Provided"}
                  </p>
                </div>
                <div className="space-y-1 border-b md:border-b-0 border-slate-100 dark:border-slate-800 pb-6 md:pb-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    CAC Registration Number
                  </p>
                  <p className="font-bold text-navy-dark dark:text-white">
                    {cacNumber || "Not Provided"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Tax Identification Number (TIN)
                  </p>
                  <p className="font-bold text-navy-dark dark:text-white">
                    {taxId || "Not Provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Bank Account Display */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-navy-dark text-white flex items-center justify-center font-black text-xs shadow-lg shadow-navy-dark/20 text-blue-400">
                  02
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
                    Settlement Payout Bank
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                    Where your hardware trade earnings will be sent
                  </p>
                </div>
              </div>
              <StatusBadge status={bankAccountNo ? "VERIFIED" : "PENDING"} />
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-6 md:pb-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Bank Name
                  </p>
                  <p className="font-bold text-navy-dark dark:text-white">
                    {getBankName(bankCode)}
                  </p>
                </div>
                <div className="space-y-1 border-b md:border-b-0 border-slate-100 dark:border-slate-800 pb-6 md:pb-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Account Number
                  </p>
                  <p className="font-bold text-navy-dark dark:text-white">
                    {bankAccountNo
                      ? `******${bankAccountNo.slice(-4)}`
                      : "Not Provided"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Account Name
                  </p>
                  <p className="font-bold text-navy-dark dark:text-white">
                    {bankAccountName || "Not Provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Help Note */}
      <div className="bg-navy-dark rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
        <div className="flex items-center gap-6 relative z-10 text-white">
          <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/5">
            <span className="material-symbols-outlined text-3xl">info</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold leading-relaxed max-w-sm">
              If any of your verification details look incorrect, please update
              your profile via the Onboarding flow.
            </p>
            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
              Changes require re-verification
            </p>
          </div>
        </div>
        <div className="flex gap-4 relative z-10 w-full md:w-auto">
          <Link
            href="/merchant/onboarding"
            className="flex-1 md:flex-none px-10 py-4 bg-white text-navy-dark rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:-translate-y-1 transition-all active:scale-95 text-center"
          >
            Update Details
          </Link>
        </div>
        <span className="material-symbols-outlined absolute -right-12 -bottom-12 text-[180px] text-white/5 font-light group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
          verified_user
        </span>
      </div>
    </div>
  );
}
