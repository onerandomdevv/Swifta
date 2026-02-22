"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { nairaToKobo } from "@hardware-os/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { getRFQ } from "@/lib/api/rfq.api";
import { submitQuote } from "@/lib/api/quote.api";
import type { RFQ } from "@hardware-os/shared";

// Extracted Components
import { RfqSummary } from "@/components/merchant/rfqs/rfq-summary";
import { QuoteSubmissionForm } from "@/components/merchant/rfqs/quote-submission-form";

export default function MerchantRFQDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [deliveryFee, setDeliveryFee] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function fetchRFQ() {
      try {
        const data = await getRFQ(id as string);
        setRfq(data as any as RFQ);
      } catch (err: any) {
        setError(err?.message || "Failed to load RFQ");
      } finally {
        setLoading(false);
      }
    }
    fetchRFQ();
  }, [id]);

  const handleQuote = async () => {
    if (!unitPrice || !rfq) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const unitPriceKobo = nairaToKobo(parseFloat(unitPrice));
      const deliveryFeeKobo = deliveryFee
        ? nairaToKobo(parseFloat(deliveryFee))
        : 0n;
      const totalPriceKobo =
        unitPriceKobo * BigInt(rfq.quantity) + deliveryFeeKobo;

      const validUntil = new Date();
      validUntil.setHours(validUntil.getHours() + 48);

      await submitQuote({
        rfqId: rfq.id,
        unitPriceKobo,
        totalPriceKobo,
        deliveryFeeKobo,
        validUntil,
        notes: notes || undefined,
      });
      router.push("/merchant/rfqs");
    } catch (err: any) {
      setError(err?.message || "Failed to submit quote");
    } finally {
      setIsSubmitting(false);
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
            <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !rfq) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <span className="material-symbols-outlined text-5xl text-red-400">
          error
        </span>
        <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
          {error}
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

  if (!rfq) return null;

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
            Contract Tender
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
            RFQ: {rfq.id.slice(0, 8)} &bull;{" "}
            {new Date(rfq.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <RfqSummary rfq={rfq} />

        <QuoteSubmissionForm
          rfq={rfq}
          unitPrice={unitPrice}
          setUnitPrice={setUnitPrice}
          deliveryFee={deliveryFee}
          setDeliveryFee={setDeliveryFee}
          notes={notes}
          setNotes={setNotes}
          error={error}
          isSubmitting={isSubmitting}
          onSubmit={handleQuote}
        />
      </div>
    </div>
  );
}
