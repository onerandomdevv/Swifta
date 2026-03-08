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
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none font-display">
            Trade Financing
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide">
            Manage your stock financing and credit facilities
          </p>
        </div>
        <Link
          href="/merchant/wholesale"
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">
            local_shipping
          </span>
          Buy Stock with Credit
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
            Available Credit
          </label>
          <p className="text-3xl font-black text-indigo-600 tabular-nums">
            {eligibility?.eligible
              ? formatKobo(BigInt(eligibility.maxAmount))
              : "₦0.00"}
          </p>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            {eligibility?.eligible
              ? "Your pre-approved limit"
              : eligibility?.reason || "Requirements not met"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
            Active Debt
          </label>
          <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {formatKobo(totalDebt)}
          </p>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            Across {activeLoans.length} active applications
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
            Credit Score
          </label>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500">
              verified
            </span>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Health: {eligibility?.creditScore || "N/A"}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            Based on your sales consistency
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
            Application History
          </h3>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-bold text-slate-500 uppercase tracking-widest">
            {loans?.length || 0} Total
          </span>
        </div>

        {!loans || loans.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <span className="material-symbols-outlined text-6xl text-slate-200">
              contract
            </span>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">
              No financing applications yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Order ID
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Principal
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Remaining
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Tenure
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loans.map((loan: any) => (
                  <tr
                    key={loan.id}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-10 py-6">
                      <p className="text-[11px] font-black text-navy-dark dark:text-white uppercase tracking-tighter">
                        #{loan.orderId.substring(0, 8)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Applied {new Date(loan.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-10 py-6 font-bold text-sm text-slate-700 dark:text-slate-300">
                      {formatKobo(BigInt(loan.amountKobo))}
                    </td>
                    <td className="px-10 py-6 font-black text-sm text-indigo-600">
                      {formatKobo(BigInt(loan.remainingAmountKobo))}
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {loan.tenureDays} Days
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          loan.status === "ACTIVE"
                            ? "bg-indigo-100 text-indigo-700"
                            : loan.status === "REPAID"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
