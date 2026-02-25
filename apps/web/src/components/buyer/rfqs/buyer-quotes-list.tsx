import React from "react";
import Link from "next/link";
import { formatKobo } from "@hardware-os/shared";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Quote } from "@hardware-os/shared";

interface Props {
  quotes: Quote[];
  acceptingId: string | null;
  onAcceptQuote: (quoteId: string) => void;
}

export function BuyerQuotesList({ quotes, acceptingId, onAcceptQuote }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm sticky top-10">
      <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-50 dark:border-slate-800">
        <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
          Received Quotes
        </h3>
        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">
          {quotes.length} Responses
        </span>
      </div>

      {quotes.length > 0 ? (
        <div className="space-y-6">
          {quotes?.map((quote) => (
            <div
              key={quote.id}
              className="flex gap-4 max-w-[95%] ml-auto flex-row-reverse group"
            >
              {/* Avatar Icon */}
              <div className="h-10 w-10 shrink-0 bg-primary/10 flex items-center justify-center rounded-lg border border-primary/20 shadow-sm mt-1">
                <span className="material-symbols-outlined text-sm text-primary">
                  storefront
                </span>
              </div>

              <div className="flex flex-col gap-2 items-end w-full">
                <div className="flex items-center gap-2">
                  {quote.status !== "PENDING" && (
                    <StatusBadge status={quote.status} className="text-[9px]" />
                  )}
                  {quote.merchant && (
                    <Link
                      href={`/merchants/${quote.merchantId || quote.merchant.id}`}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors"
                    >
                      {quote.merchant.businessName}
                    </Link>
                  )}
                </div>

                {/* Structured Quote Card */}
                <div className="bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] transition-transform group-hover:-translate-y-1 duration-300">
                  <div className="bg-slate-900 dark:bg-slate-100 p-2 flex justify-between items-center">
                    <h3 className="text-[10px] items-center font-bold text-white dark:text-slate-900 uppercase tracking-widest pl-1">
                      Official Quote #{quote.id.slice(0, 8)}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium px-2">
                      24h
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-700 pb-3">
                      <span className="text-xs font-semibold text-slate-500">
                        Unit Price
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatKobo(BigInt(quote.unitPriceKobo))}
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-700 pb-3">
                      <span className="text-xs font-semibold text-slate-500">
                        Delivery Fee
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatKobo(BigInt(quote.deliveryFeeKobo))}
                      </span>
                    </div>
                    <div className="flex justify-between items-end pt-1">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        Total Amount
                      </span>
                      <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {formatKobo(BigInt(quote.totalPriceKobo))}
                      </span>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 p-2 mt-4 text-center rounded">
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter">
                        Expiry: Valid for 48 Hours
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {quote.status === "PENDING" && (
                  <div className="flex gap-3 w-full mt-2">
                    <button
                      onClick={() => onAcceptQuote(quote.id)}
                      disabled={acceptingId === quote.id}
                      className="flex-1 bg-primary text-slate-900 text-[11px] font-bold py-3.5 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all border border-slate-900 active:bg-primary/90 disabled:opacity-50"
                    >
                      {acceptingId === quote.id
                        ? "Processing..."
                        : "Accept & Pay"}
                    </button>
                    <button className="px-6 border border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold py-3.5 uppercase tracking-wider transition-colors disabled:opacity-50">
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-slate-200 mb-4">
            hourglass_empty
          </span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Awaiting merchant quotes
          </p>
        </div>
      )}

      <p className="mt-10 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60 leading-relaxed">
        Accepting a quote will automatically generate a purchase order and
        initiate the escrow process.
      </p>
    </div>
  );
}
