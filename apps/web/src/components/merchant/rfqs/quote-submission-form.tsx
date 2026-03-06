import React from "react";
import { formatKobo, nairaToKobo } from "@hardware-os/shared";
import type { RFQ } from "@hardware-os/shared";

interface Props {
  rfq: RFQ;
  unitPrice: string;
  setUnitPrice: (val: string) => void;
  deliveryFee: string;
  setDeliveryFee: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  error: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function QuoteSubmissionForm({
  rfq,
  unitPrice,
  setUnitPrice,
  deliveryFee,
  setDeliveryFee,
  notes,
  setNotes,
  error,
  isSubmitting,
  onSubmit,
}: Props) {
  return (
    <div className="lg:col-span-5">
      {/* Stitch V1 Aesthetic: Structured Quote Entry Card */}
      <div className="bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
        {/* Header Block */}
        <div className="bg-slate-900 dark:bg-slate-100 p-3">
          <h3 className="text-xs font-bold text-white dark:text-slate-900 uppercase tracking-widest text-center">
            Generate Official Quote
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wide text-center">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-2 relative">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Unit Price (₦)
            </span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-900 dark:text-white">
                ₦
              </span>
              <input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3 pl-10 text-sm font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2 relative">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Delivery Fee (₦)
            </span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-900 dark:text-white">
                ₦
              </span>
              <input
                type="number"
                step="0.01"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3 pl-10 text-sm font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Terms / Notes (Optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none h-20 resize-none"
              placeholder="e.g. Delivery timeline, validity..."
            />
          </div>

          {unitPrice && rfq && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Total Amount
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {formatKobo(
                    nairaToKobo(parseFloat(unitPrice)) * BigInt(rfq.quantity) +
                      (deliveryFee ? nairaToKobo(parseFloat(deliveryFee)) : 0n),
                  )}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={onSubmit}
            disabled={isSubmitting || !unitPrice}
            className="w-full bg-primary text-slate-900 text-sm font-bold py-4 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] border border-slate-900 hover:bg-[#2dbd66] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Submitting..." : "Submit Official Quote"}
          </button>
        </div>
      </div>
    </div>
  );
}
