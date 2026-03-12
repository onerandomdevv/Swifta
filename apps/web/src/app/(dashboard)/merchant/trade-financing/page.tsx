"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getTradeFinancingLoans,
  checkTradeFinancingEligibility,
} from "@/lib/api/trade-financing.api";
import { formatKobo } from "@hardware-os/shared";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function MerchantTradeFinancingPage() {
  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ["trade-financing", "loans"],
    queryFn: getTradeFinancingLoans,
  });

  const { data: eligibility, isLoading: eligibilityLoading } = useQuery({
    queryKey: ["trade-financing", "eligibility"],
    queryFn: checkTradeFinancingEligibility,
  });

  if (loansLoading || eligibilityLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
        <Skeleton className="h-96 rounded-[2.5rem]" />
      </div>
    );
  }

  const activeLoans = loans?.filter((l) => l.status === "ACTIVE") || [];
  const totalDebt = activeLoans.reduce(
    (acc, l) => acc + BigInt(l.remainingAmountKobo || 0),
    BigInt(0),
  );
  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative h-[80vh]">
      <div className="absolute inset-0 z-[100] backdrop-blur-md bg-white/40 dark:bg-slate-900/40 flex flex-col items-center justify-center p-8 animate-in fade-in duration-1000">
        <div className="max-w-md w-full p-12 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl text-center space-y-8">
           <div className="size-24 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl text-indigo-500 animate-pulse">account_balance</span>
           </div>
           <div className="space-y-3">
              <h2 className="text-3xl font-black text-navy-dark dark:text-white uppercase tracking-tighter">Trade Financing</h2>
              <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50/50 dark:bg-indigo-900/30 px-3 py-1 rounded-full inline-block">Service Integration Pending</p>
           </div>
           <p className="text-slate-500 font-bold text-sm leading-relaxed">
              We are working with our financial partners to provide seamless credit lines for your inventory needs. Trade Financing will be available in Phase 2.
           </p>
           <button 
             onClick={() => window.location.href = "/merchant/dashboard"}
             className="px-10 py-5 bg-navy-dark dark:bg-white text-white dark:text-navy-dark rounded-[1.25rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-navy-dark/20 hover:scale-105 active:scale-95 transition-all w-full"
           >
             Return to Dashboard
           </button>
        </div>
      </div>
    </div>
  );
}
