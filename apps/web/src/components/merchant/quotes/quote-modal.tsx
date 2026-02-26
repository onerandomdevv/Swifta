"use client";

import React, { useState, useEffect } from "react";
import { submitQuote, updateQuote } from "@/lib/api/quote.api";
import { formatKobo, nairaToKobo } from "@hardware-os/shared";
import type { RFQ, Quote } from "@hardware-os/shared";

interface QuoteModalProps {
  mode: "create" | "update";
  rfq: RFQ;
  existingQuote?: Quote | null;
  onSuccess: (quote: Quote) => void;
  onClose: () => void;
}

export function QuoteModal({
  mode,
  rfq,
  existingQuote,
  onSuccess,
  onClose,
}: QuoteModalProps) {
  const [unitPrice, setUnitPrice] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [terms, setTerms] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "update" && existingQuote) {
      setUnitPrice(String(Number(existingQuote.unitPriceKobo) / 100));
      setDeliveryFee(String(Number(existingQuote.deliveryFeeKobo) / 100));
      setTerms(existingQuote.notes || "");
      if (existingQuote.validUntil) {
        const d = new Date(existingQuote.validUntil);
        setValidUntil(d.toISOString().split("T")[0]);
      }
    } else {
      // Default expiry: 48 hours from now
      const d = new Date();
      d.setDate(d.getDate() + 2);
      setValidUntil(d.toISOString().split("T")[0]);
    }
  }, [mode, existingQuote]);

  const unitPriceNum = parseFloat(unitPrice) || 0;
  const deliveryFeeNum = parseFloat(deliveryFee) || 0;
  const totalNaira = unitPriceNum * rfq.quantity + deliveryFeeNum;

  const handleSubmit = async () => {
    if (!unitPrice || unitPriceNum <= 0) {
      setError("Unit price is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const unitPriceKobo = nairaToKobo(unitPriceNum);
      const deliveryFeeKobo = nairaToKobo(deliveryFeeNum);
      const totalPriceKobo =
        unitPriceKobo * BigInt(rfq.quantity) + deliveryFeeKobo;

      const quoteData = {
        rfqId: rfq.id,
        unitPriceKobo,
        totalPriceKobo,
        deliveryFeeKobo,
        validUntil: new Date(validUntil),
        notes: terms || undefined,
      };

      const result =
        mode === "update" && existingQuote
          ? await updateQuote(existingQuote.id, quoteData)
          : await submitQuote(quoteData);
      onSuccess(result);
    } catch (err: any) {
      setError(err?.message || "Failed to submit quote");
    } finally {
      setSubmitting(false);
    }
  };

  const refId = rfq.id.slice(0, 8).toUpperCase();
  const isCreate = mode === "create";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] flex flex-col max-h-[90vh]">
          {/* Dark Header */}
          <div className="bg-slate-900 dark:bg-slate-100 p-4 flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-[11px] font-black text-white dark:text-slate-900 uppercase tracking-[0.2em]">
                {isCreate ? "Create Official Quote" : "Update Official Quote"}
              </h3>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 uppercase">
                {isCreate ? "Draft Mode" : "Revise pricing after negotiation"} •
                Ref: #RFQ-{refId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white dark:text-slate-900 hover:text-slate-300 dark:hover:text-slate-600"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-[10px] font-bold text-red-600 uppercase tracking-wide text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Unit Price */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Unit Price (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-400">
                    ₦
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 pl-8 pr-4 font-mono text-sm font-bold focus:border-slate-900 dark:focus:border-white focus:ring-0 outline-none text-slate-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Delivery Fee */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Delivery Fee (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-400">
                    ₦
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    className="w-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 pl-8 pr-4 font-mono text-sm font-bold focus:border-slate-900 dark:focus:border-white focus:ring-0 outline-none text-slate-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Subtotal */}
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-500">
                    Quote Subtotal ({rfq.quantity} Units)
                  </span>
                  <span className="font-mono text-lg font-black tracking-tighter text-slate-900 dark:text-white">
                    ₦
                    {totalNaira.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Expiry + Terms */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Quote Expiry
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    calendar_today
                  </span>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 pl-10 pr-4 text-xs font-bold uppercase focus:border-slate-900 dark:focus:border-white focus:ring-0 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Merchant Terms & Conditions
                </label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-xs font-medium focus:border-slate-900 dark:focus:border-white focus:ring-0 outline-none resize-none text-slate-900 dark:text-white"
                  placeholder="Specify any specific haulage or site access conditions..."
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-3 shrink-0">
            <button
              onClick={handleSubmit}
              disabled={submitting || !unitPrice}
              className="w-full bg-green-500 text-white text-xs font-black py-4 uppercase tracking-[0.2em] hover:bg-green-600 border border-slate-900 dark:border-slate-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : isCreate
                  ? "Send Official Quote"
                  : "Update Official Quote"}
            </button>
            <button
              onClick={onClose}
              className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-500 text-xs font-black py-4 uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
