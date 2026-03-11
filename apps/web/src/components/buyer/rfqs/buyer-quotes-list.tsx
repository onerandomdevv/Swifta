import React, { useState } from "react";
import Link from "next/link";
import { formatKobo } from "@hardware-os/shared";
import { StatusBadge } from "@/components/ui/status-badge";
import { declineQuote } from "@/lib/api/quote.api";
import type { Quote } from "@hardware-os/shared";

interface Props {
  quotes: Quote[];
  acceptingId: string | null;
  onAcceptQuote: (quoteId: string) => void;
}

export function BuyerQuotesList({ quotes, acceptingId, onAcceptQuote }: Props) {
  const [negotiatingId, setNegotiatingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const handleDecline = async (quoteId: string) => {
    setDecliningId(quoteId);
    try {
      await declineQuote(quoteId);
      // Optional: Add success toast/notification here if available
    } catch (error) {
      console.error("Failed to decline quote:", error);
      alert("Failed to decline quote. Please try again.");
    } finally {
      setDecliningId(null);
    }
  };

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
                  {quote.merchantProfile && (
                    <Link
                      href={`/buyer/merchants/${quote.merchantId}`}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors"
                    >
                      {quote.merchantProfile.businessName}
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
                  <div className="flex flex-col gap-3 w-full mt-2">
                    {/* Accept & Pay */}
                    <button
                      onClick={() => onAcceptQuote(quote.id)}
                      disabled={acceptingId === quote.id}
                      className="w-full bg-green-500 text-white text-[11px] font-black py-4 uppercase tracking-[0.15em] hover:bg-green-600 border border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-50"
                    >
                      {acceptingId === quote.id
                        ? "Processing..."
                        : "Accept & Pay Now"}
                    </button>

                    {/* Decline */}
                    <button
                      onClick={() => handleDecline(quote.id)}
                      disabled={decliningId === quote.id}
                      className="w-full border-2 border-slate-200 dark:border-slate-600 text-slate-500 text-[11px] font-black py-4 uppercase tracking-[0.15em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      {decliningId === quote.id
                        ? "Declining..."
                        : "Decline Quote"}
                    </button>

                    {/* Negotiate Price */}
                    <button
                      onClick={() =>
                        setNegotiatingId(
                          negotiatingId === quote.id ? null : quote.id,
                        )
                      }
                      className="w-full border-2 border-slate-600 dark:border-slate-400 text-slate-600 dark:text-slate-400 text-[11px] font-black py-4 uppercase tracking-[0.15em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Negotiate Price
                    </button>

                    {/* WhatsApp Card (revealed on negotiate) */}
                    {negotiatingId === quote.id && (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 mt-1 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="flex items-start gap-4">
                          <div className="bg-[#25D366] p-2 flex items-center justify-center shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="white"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                WhatsApp Direct
                              </span>
                              {quote.merchantProfile?.user?.phone ? (
                                <a
                                  href={`https://wa.me/${quote.merchantProfile.user.phone
                                    .replace(/\D/g, "")
                                    .replace(/^0/, "234")
                                    .replace(/^(\d)/, (match: string) =>
                                      match === "2" ? match : "234" + match,
                                    )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-mono font-bold text-slate-900 dark:text-white hover:underline"
                                >
                                  {quote.merchantProfile.user.phone}
                                </a>
                              ) : (
                                <a
                                  href={`https://wa.me/`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-mono font-bold text-slate-900 dark:text-white hover:underline"
                                >
                                  Contact Merchant
                                </a>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-normal uppercase tracking-tight">
                              Discuss pricing on WhatsApp. Return here to accept
                              the updated quote.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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
