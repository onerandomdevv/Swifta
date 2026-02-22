"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Money } from "@/components/ui/money";
import { getMerchantRFQs } from "@/lib/api/rfq.api";
import { getQuotesByRFQ } from "@/lib/api/quote.api";
import type { RFQ, Quote } from "@hardware-os/shared";

interface QuoteWithRFQ {
  quote: Quote;
  rfq: RFQ;
}

export default function MerchantQuotesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quotesWithRfqs, setQuotesWithRfqs] = useState<QuoteWithRFQ[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const rfqList = await getMerchantRFQs(1, 50);

        const results = await Promise.all(
          rfqList.map(async (rfq) => {
            try {
              const quotes = (await getQuotesByRFQ(
                rfq.id,
              )) as unknown as Quote[];
              return (Array.isArray(quotes) ? quotes : []).map((q) => ({
                quote: q,
                rfq,
              }));
            } catch {
              return [];
            }
          }),
        );
        setQuotesWithRfqs(results.flat());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load quotes");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeCount = quotesWithRfqs.filter(
    (q) => q.quote.status === "PENDING",
  ).length;
  const acceptedCount = quotesWithRfqs.filter(
    (q) => q.quote.status === "ACCEPTED",
  ).length;
  const totalValue = quotesWithRfqs.reduce(
    (sum, q) => sum + BigInt(q.quote.totalPriceKobo || 0),
    0n,
  );

  const stats = [
    {
      label: "Active Quotes",
      value: String(quotesWithRfqs.length),
      trend: `${activeCount} pending`,
      trendColor: "text-emerald-600",
    },
    {
      label: "Accepted",
      value: String(acceptedCount),
      trend: "Converted to orders",
      trendColor: "text-emerald-600",
    },
    {
      label: "Pipeline Value",
      value: <Money amount={totalValue} />,
      trend: `${quotesWithRfqs.length} quotes`,
      trendColor: "text-emerald-600",
    },
  ];

  const statusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Sent";
      case "ACCEPTED":
        return "Accepted";
      case "DECLINED":
        return "Declined";
      case "EXPIRED":
        return "Expired";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 py-2">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400 mb-4">
          error
        </span>
        <p className="text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
            Quotes Center
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide">
            Manage and track your active trade offers and conversions.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-black text-navy-dark dark:text-white tracking-tight leading-none">
                {stat.value}
              </p>
              <p
                className={`text-[10px] font-black uppercase tracking-widest ${stat.trendColor}`}
              >
                {stat.trend}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quotes Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl shadow-navy-dark/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Quote & RFQ
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Trade Value
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Date
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Status
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {quotesWithRfqs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-8 py-16 text-center text-slate-400 text-sm font-bold uppercase tracking-widest"
                  >
                    No quotes submitted yet. Respond to RFQs to create quotes.
                  </td>
                </tr>
              ) : (
                quotesWithRfqs.map(({ quote, rfq }) => {
                  const status = statusLabel(quote.status);
                  return (
                    <tr
                      key={quote.id}
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className="size-10 rounded-xl bg-navy-dark/5 dark:bg-white/5 flex items-center justify-center border border-navy-dark/10 dark:border-white/10 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-navy-dark dark:text-white text-xl">
                              file_present
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-black text-navy-dark dark:text-white leading-tight mb-1">
                              #{quote.id.slice(0, 8)}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              RFQ: #{rfq.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-black text-navy-dark dark:text-white tracking-tight">
                          <Money amount={BigInt(quote.totalPriceKobo)} />
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border h-7 ${
                            status === "Accepted"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400"
                              : status === "Sent"
                                ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400"
                                : status === "Declined"
                                  ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:text-red-400"
                                  : "bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-800 dark:text-slate-500"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full mr-2 ${
                              status === "Accepted"
                                ? "bg-emerald-500"
                                : status === "Sent"
                                  ? "bg-blue-500"
                                  : status === "Declined"
                                    ? "bg-red-500"
                                    : "bg-slate-300"
                            }`}
                          ></span>
                          {status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link
                          href={`/merchant/rfqs/${rfq.id}`}
                          className="size-10 rounded-xl text-slate-400 hover:text-navy-dark hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 inline-flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined">
                            visibility
                          </span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
