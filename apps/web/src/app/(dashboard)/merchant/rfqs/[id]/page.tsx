"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nairaToKobo } from "@hardware-os/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { getRFQ } from "@/lib/api/rfq.api";
import { submitQuote } from "@/lib/api/quote.api";
import type { RFQ } from "@hardware-os/shared";

// Extracted Components
import { RfqSummary, QuoteSubmissionForm } from "@/components/merchant/rfqs";

export default function MerchantRFQDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
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

  const quoteMutation = useMutation({
    mutationFn: submitQuote,
    onMutate: async (newQuote) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['merchant', 'rfqs'] });
      const previousRfqs = queryClient.getQueryData<RFQ[]>(['merchant', 'rfqs', 'recent']);
      
      if (previousRfqs && rfq) {
        // Find and update the specific RFQ in the cached list to "QUOTED" status
        const updatedRfqs = previousRfqs.map(prevRfq => {
          if (prevRfq.id === rfq.id) {
            return {
              ...prevRfq,
              status: "QUOTED" as any
            };
          }
          return prevRfq;
        });
        queryClient.setQueryData<RFQ[]>(['merchant', 'rfqs', 'recent'], updatedRfqs);
      }
      return { previousRfqs };
    },
    onError: (err: any, _, context) => {
      setError(err?.message || "Failed to submit quote");
      if (context?.previousRfqs) {
        queryClient.setQueryData(['merchant', 'rfqs', 'recent'], context.previousRfqs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'rfqs'] });
    },
    onSuccess: () => {
      router.push("/merchant/rfqs");
    }
  });

  const handleQuote = () => {
    if (!unitPrice || !rfq) return;
    setError(null);

    const unitPriceKobo = nairaToKobo(parseFloat(unitPrice));
    const deliveryFeeKobo = deliveryFee
      ? nairaToKobo(parseFloat(deliveryFee))
      : 0n;
    const totalPriceKobo =
      unitPriceKobo * BigInt(rfq.quantity) + deliveryFeeKobo;

    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 48);

    quoteMutation.mutate({
      rfqId: rfq.id,
      unitPriceKobo,
      totalPriceKobo,
      deliveryFeeKobo,
      validUntil,
      notes: notes || undefined,
    });
  };

  const isSubmitting = quoteMutation.isPending;

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

        {rfq.status === "OPEN" ? (
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
        ) : (
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px] z-10 rounded-[2.5rem] flex items-center justify-center">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl shadow-navy-dark/10 border border-slate-100 dark:border-slate-700 text-center max-w-sm mx-4 transform -translate-y-4">
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-4">
                  lock
                </span>
                <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-2">
                  Tender Closed
                </h3>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  This RFQ is no longer accepting new quotes because its status is currently{" "}
                  <span className="text-navy-dark dark:text-white font-black">{rfq.status}</span>.
                </p>
              </div>
            </div>
            
            <div className="opacity-40 select-none pointer-events-none filter grayscale">
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
        )}
      </div>
    </div>
  );
}
