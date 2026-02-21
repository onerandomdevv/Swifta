"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatKobo, nairaToKobo } from "@hardware-os/shared";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getRFQ } from "@/lib/api/rfq.api";
import { submitQuote } from "@/lib/api/quote.api";
import type { RFQ } from "@hardware-os/shared";

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
      const totalPriceKobo = unitPriceKobo * BigInt(rfq.quantity) + deliveryFeeKobo;

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
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">{error}</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Go Back</button>
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
            RFQ: {rfq.id.slice(0, 8)} &bull; {new Date(rfq.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50 dark:border-slate-800">
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
                Request Details
              </h3>
              <StatusBadge status={rfq.status} />
            </div>

            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity Requested</p>
                  <p className="text-2xl font-black text-navy-dark dark:text-white">{rfq.quantity.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expires</p>
                  <p className="text-sm font-black text-navy-dark dark:text-white">{new Date(rfq.expiresAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Delivery Address</p>
                <p className="text-sm font-bold text-navy-dark dark:text-white">{rfq.deliveryAddress}</p>
              </div>
              {rfq.notes && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Buyer Notes</p>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{rfq.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10">
            <div className="flex items-center gap-4 mb-4">
              <span className="material-symbols-outlined text-blue-500 font-black">
                info
              </span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                Quote Expiration Notice
              </p>
            </div>
            <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
              Quotes submitted on Hardware OS are binding for 48 hours. Ensure
              your logistics capacity is verified before finalizing your bid.
              Settlement occurs via escrow upon delivery confirmation.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm sticky top-10">
            <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-10 pb-4 border-b border-slate-50 dark:border-slate-800">
              Submit Your Quote
            </h3>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl">
                <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">{error}</p>
              </div>
            )}

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Unit Price (₦)
                </label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-navy-dark dark:text-white">
                    ₦
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 pl-12 pr-6 text-xl font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Delivery Fee (₦)
                </label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-navy-dark dark:text-white">
                    ₦
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 pl-12 pr-6 text-lg font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 px-6 text-sm font-bold text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all h-24 resize-none"
                  placeholder="Delivery timeline, brand details..."
                />
              </div>

              {unitPrice && rfq && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Quote</p>
                  <p className="text-xl font-black text-navy-dark dark:text-white tabular-nums">
                    {formatKobo(
                      nairaToKobo(parseFloat(unitPrice)) * BigInt(rfq.quantity) +
                      (deliveryFee ? nairaToKobo(parseFloat(deliveryFee)) : 0n)
                    )}
                  </p>
                </div>
              )}

              <button
                onClick={handleQuote}
                disabled={isSubmitting || !unitPrice}
                className="w-full py-5 bg-navy-dark text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-80"
              >
                {isSubmitting ? "Bidding..." : "Submit Official Bid"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
