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
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm sticky top-10">
        <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-10 pb-4 border-b border-slate-50 dark:border-slate-800">
          Submit Your Quote
        </h3>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl">
            <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
              {error}
            </p>
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
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Total Quote
              </p>
              <p className="text-xl font-black text-navy-dark dark:text-white tabular-nums">
                {formatKobo(
                  nairaToKobo(parseFloat(unitPrice)) * BigInt(rfq.quantity) +
                    (deliveryFee ? nairaToKobo(parseFloat(deliveryFee)) : 0n),
                )}
              </p>
            </div>
          )}

          <button
            onClick={onSubmit}
            disabled={isSubmitting || !unitPrice}
            className="w-full py-5 bg-navy-dark text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-80"
          >
            {isSubmitting ? "Bidding..." : "Submit Official Bid"}
          </button>
        </div>
      </div>
    </div>
  );
}
