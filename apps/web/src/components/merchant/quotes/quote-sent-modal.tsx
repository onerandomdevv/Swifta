"use client";

import React from "react";
import type { Quote, RFQ } from "@hardware-os/shared";

interface QuoteSentModalProps {
  quote: Quote;
  rfq: RFQ;
  onReturnToWorkspace: () => void;
  onViewAllQuotes?: () => void;
  onClose: () => void;
}

function formatNaira(kobo: number | bigint): string {
  const naira = Number(kobo) / 100;
  return `₦${naira.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function QuoteSentModal({
  quote,
  rfq,
  onReturnToWorkspace,
  onViewAllQuotes,
  onClose,
}: QuoteSentModalProps) {
  const totalKobo = Number(quote.totalPriceKobo);
  const refId = `#QT-${quote.id.slice(0, 4).toUpperCase()}-${rfq.id.slice(0, 2).toUpperCase()}`;
  const expiryDate = new Date(quote.validUntil).toLocaleDateString("en-GB");
  const productName =
    rfq.product?.name || rfq.unlistedItemDetails?.name || "Requested Item";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl animate-in zoom-in-95 fade-in duration-300">
          {/* Success Icon + Title */}
          <div className="flex flex-col items-center pt-10 pb-6 px-8">
            <div className="w-16 h-16 bg-green-500 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-white text-4xl font-bold">
                check
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white text-center">
              Official Quote Sent
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">
              Status: Outgoing / Pending Acceptance
            </p>
          </div>

          {/* Summary Grid */}
          <div className="mx-8 border-2 border-primary/30 dark:border-primary/20">
            <div className="grid grid-cols-2 divide-x divide-primary/20">
              <div className="p-4">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                  Total Amount
                </p>
                <p className="text-lg font-black font-mono text-slate-900 dark:text-white tracking-tight">
                  {formatNaira(totalKobo)}
                </p>
              </div>
              <div className="p-4">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                  Recipient
                </p>
                <p className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                  {productName}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-primary/20 border-t border-primary/20">
              <div className="p-4">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                  Expiry Date
                </p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {expiryDate}
                </p>
              </div>
              <div className="p-4">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                  Transaction ID
                </p>
                <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                  {refId}
                </p>
              </div>
            </div>
          </div>

          {/* Notification Info */}
          <div className="mx-8 mt-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">
              info
            </span>
            <div>
              <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 mb-0.5">
                Notification Sent
              </p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                The buyer has been formally notified via encrypted email and SMS
                dispatch. A copy of this quote has been archived in your
                outgoing ledger.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-8 space-y-3">
            <button
              onClick={onReturnToWorkspace}
              className="w-full bg-primary text-white text-xs font-black py-4 uppercase tracking-[0.2em] hover:bg-blue-700 transition-colors"
            >
              Return to Conversation Workspace
            </button>
            {onViewAllQuotes && (
              <button
                onClick={onViewAllQuotes}
                className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-500 text-xs font-black py-4 uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                View All Outgoing Quotes
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
