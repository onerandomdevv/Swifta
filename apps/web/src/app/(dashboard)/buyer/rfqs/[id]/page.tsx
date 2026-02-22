"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatKobo } from "@hardware-os/shared";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getRFQ } from "@/lib/api/rfq.api";
import { getQuotesByRFQ, acceptQuote } from "@/lib/api/quote.api";
import type { RFQ, Quote } from "@hardware-os/shared";

// Extracted Components
import { BuyerRFQSummary, BuyerQuotesList } from "@/components/buyer/rfqs";

export default function BuyerRFQDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [rfqData, quotesData] = await Promise.all([
          getRFQ(id as string),
          getQuotesByRFQ(id as string),
        ]);
        setRfq(rfqData as any as RFQ);
        setQuotes(Array.isArray(quotesData) ? quotesData : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load RFQ details");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleAcceptQuote = async (quoteId: string) => {
    setAcceptingId(quoteId);
    try {
      await acceptQuote(quoteId);
      router.push("/buyer/orders");
    } catch (err: any) {
      setError(err?.message || "Failed to accept quote");
      setAcceptingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            <Skeleton className="h-96 w-full rounded-[2.5rem]" />
          </div>
          <div className="lg:col-span-5 space-y-8">
            <Skeleton className="h-[500px] w-full rounded-[2.5rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <span className="material-symbols-outlined text-5xl text-red-400">
          error
        </span>
        <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
          {error || "RFQ not found"}
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-6">
        <button
          onClick={() => router.back()}
          className="size-12 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
            RFQ Details
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
            Reference: {rfq.id.slice(0, 8)} &bull; Submitted{" "}
            {new Date(rfq.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-10">
          <BuyerRFQSummary rfq={rfq} />
        </div>

        <div className="lg:col-span-5">
          <BuyerQuotesList
            quotes={quotes}
            acceptingId={acceptingId}
            onAcceptQuote={handleAcceptQuote}
          />
        </div>
      </div>
    </div>
  );
}
