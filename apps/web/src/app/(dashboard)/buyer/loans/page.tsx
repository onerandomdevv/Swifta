"use client";

import React, { useState, useEffect } from "react";
import { getTradeFinancingLoans } from "@/lib/api/trade-financing.api";
import { Skeleton } from "@/components/ui/skeleton";

export default function BuyerLoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTradeFinancingLoans();
        setLoans(data as any[]);
      } catch (err: any) {
        setError(err.message || "Failed to load loans.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatMoney = (kobo: number) =>
    (Number(kobo) / 100).toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    });

  if (loading) {
    return (
      <div className="p-8 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">
            Trade Financing
          </h1>
          <p className="text-sm font-medium text-slate-500 tracking-wide mt-1">
            Manage your stock financing and B2B credit
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded text-sm font-bold">
          {error}
        </div>
      )}

      {loans.length === 0 && !error ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 mt-6">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">
            payments
          </span>
          <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">
            No active loans found
          </p>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            You can apply for Trade Financing during checkout if you're
            eligible.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 mt-6">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row justify-between gap-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500 text-sm">
                    account_balance
                  </span>
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                    {loan.partnerName || "Trade Financing Partner"}
                  </p>
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  {loan.order?.product?.name ||
                    loan.order?.supplierProduct?.name ||
                    "Order #" + loan.orderId.substring(0, 8)}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Ref:{" "}
                  {loan.partnerDisbursementRef ||
                    loan.partnerLoanRef ||
                    "Pending"}
                </p>

                <div className="pt-2 flex gap-3 items-center">
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-widest ${
                      loan.status === "ACTIVE" ||
                      loan.status === "APPROVED" ||
                      loan.status === "DISBURSED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : loan.status === "PENDING"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-800 border border-slate-200"
                    }`}
                  >
                    {loan.status}
                  </span>
                  <span className="text-xs text-slate-400 font-medium tracking-wide">
                    Applied on: {new Date(loan.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end justify-center bg-slate-50 p-5 rounded-lg border border-slate-100 min-w-[220px]">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Total Loan Amount
                </p>
                <p className="text-2xl font-black text-slate-900">
                  {formatMoney(
                    loan.approvedAmount || loan.principalAmountKobo || 0,
                  )}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
                  {loan.tenureDays || loan.tenure || "30"} Days Tenure @{" "}
                  {loan.interestRate || 0}% Interest
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
