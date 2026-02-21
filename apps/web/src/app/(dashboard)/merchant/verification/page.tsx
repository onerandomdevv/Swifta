"use client";

import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/providers/auth-provider";

export default function MerchantVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [idType, setIdType] = useState("NIN");
  const [isVerified, setIsVerified] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState("Access Bank");
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
        <div className="space-y-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-12 w-96 rounded-xl" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-96 w-full rounded-[2rem]" />
          <Skeleton className="h-64 w-full rounded-[2rem]" />
        </div>
      </div>
    );
  }

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
          <StatusBadge status="PENDING" className="px-5 py-2" />
        </div>
      </div>

      {/* Stepper Indicator */}
      <div className="flex gap-4">
        <div className="flex-1 h-1.5 bg-navy-dark dark:bg-blue-500 rounded-full"></div>
        <div className="flex-1 h-1.5 bg-navy-dark dark:bg-blue-500 rounded-full"></div>
        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
          <div className="absolute inset-0 bg-navy-dark/30 dark:bg-blue-500/30 w-full animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* 1. Identity Verification Section */}
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
                  Provide valid business owner identification
                </p>
              </div>
            </div>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  ID Document Type
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full px-6 py-4 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-2xl focus:border-navy-dark dark:focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer dark:text-white"
                >
                  <option value="NIN">National Identity Number (NIN)</option>
                  <option value="DL">Driver's License</option>
                  <option value="Passport">International Passport</option>
                  <option value="Voters">Voter's Card</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  ID Number
                </label>
                <input
                  className="w-full px-6 py-4 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-2xl focus:border-navy-dark dark:focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 dark:text-white"
                  placeholder="Enter ID number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:border-navy-dark dark:hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group/upload">
                <div className="size-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover/upload:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-slate-300 group-hover/upload:text-navy-dark dark:group-hover/upload:text-blue-400 transition-colors">
                    back_hand
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-navy-dark dark:text-white">
                    ID Front Face
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">
                    Click to upload photo
                  </p>
                </div>
              </div>
              <div className="border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:border-navy-dark dark:hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group/upload">
                <div className="size-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover/upload:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-slate-300 group-hover/upload:text-navy-dark dark:group-hover/upload:text-blue-400 transition-colors">
                    back_hand
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-navy-dark dark:text-white">
                    ID Back Face
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">
                    Click to upload photo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Bank Account Verification Section */}
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
          </div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Select Bank
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-6 py-4 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-2xl focus:border-navy-dark dark:focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer dark:text-white"
                >
                  <option>Access Bank</option>
                  <option>GTBank</option>
                  <option>Zenith Bank</option>
                  <option>First Bank</option>
                  <option>UBA</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Account Number
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="flex-1 px-6 py-4 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-2xl focus:border-navy-dark dark:focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 dark:text-white"
                    placeholder="10-digit number"
                  />
                  <button
                    onClick={() => setIsVerified(true)}
                    className="px-8 py-4 bg-navy-dark dark:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-navy-dark/10 dark:shadow-blue-500/20"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>

            {isVerified && (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/20 rounded-[1.5rem] p-6 flex items-center gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="size-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
                  <span className="material-symbols-outlined text-2xl font-black">
                    check
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">
                    Business Identity Confirmed
                  </p>
                  <p className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-tight font-display">
                    {user?.fullName || "User"} Trading Enterprise
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Platform Help Note */}
      <div className="bg-navy-dark rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
        <div className="flex items-center gap-6 relative z-10 text-white">
          <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/5">
            <span className="material-symbols-outlined text-3xl">info</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold leading-relaxed max-w-sm">
              Verification usually takes 24-48 business hours after submission.
            </p>
            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
              Securely processed via 256-bit encryption
            </p>
          </div>
        </div>
        <div className="flex gap-4 relative z-10 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            Save Draft
          </button>
          <button className="flex-1 md:flex-none px-10 py-4 bg-white text-navy-dark rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:-translate-y-1 transition-all active:scale-95">
            Submit For Verification
          </button>
        </div>
        <span className="material-symbols-outlined absolute -right-12 -bottom-12 text-[180px] text-white/5 font-light group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
          verified_user
        </span>
      </div>

      {/* Footer Links */}
      <div className="text-center space-y-4 pt-10">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          © 2024 Hardware OS. All documents are processed securely via 256-bit
          encryption.
        </p>
        <div className="flex justify-center gap-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <a
            href="#"
            className="hover:text-navy-dark dark:hover:text-white transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="hover:text-navy-dark dark:hover:text-white transition-colors"
          >
            Merchant Terms
          </a>
          <a
            href="#"
            className="hover:text-navy-dark dark:hover:text-white transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </div>
  );
}
