import React from "react";
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
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-navy-dark dark:hover:border-white transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-tight">
                    Quote {quote.id.slice(0, 8)}
                  </p>
                  <StatusBadge
                    status={quote.status}
                    className="mt-1 text-[8px]"
                  />
                </div>
                <p className="text-lg font-black text-navy-dark dark:text-white tabular-nums">
                  {formatKobo(BigInt(quote.totalPriceKobo))}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Unit: {formatKobo(BigInt(quote.unitPriceKobo))}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Delivery Fee: {formatKobo(BigInt(quote.deliveryFeeKobo))}
                  </p>
                </div>
                {quote.status === "PENDING" && (
                  <button
                    onClick={() => onAcceptQuote(quote.id)}
                    disabled={acceptingId === quote.id}
                    className="px-4 py-2 bg-navy-dark text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {acceptingId === quote.id ? "Accepting..." : "Accept Quote"}
                  </button>
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
