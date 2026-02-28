"use client";

import React, { useState, useEffect } from "react";
import { useMerchantRFQs } from "@/hooks/use-merchant-rfqs";
import { getRFQ } from "@/lib/api/rfq.api";
import { getQuotesByRFQ } from "@/lib/api/quote.api";
import { formatKobo } from "@hardware-os/shared";
import type { RFQ, Quote } from "@hardware-os/shared";
import { QuoteModal } from "@/components/merchant/quotes/quote-modal";
import { QuoteSentModal } from "@/components/merchant/quotes/quote-sent-modal";

export default function MerchantQuotesPage() {
  const { rfqs, loading } = useMerchantRFQs();
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteModalMode, setQuoteModalMode] = useState<"create" | "update">(
    "create",
  );
  const [sentQuote, setSentQuote] = useState<{ quote: Quote; rfq: RFQ } | null>(
    null,
  );

  // Load RFQ details + quotes when selected
  useEffect(() => {
    if (!selectedRfqId) return;
    setLoadingDetails(true);
    Promise.all([getRFQ(selectedRfqId), getQuotesByRFQ(selectedRfqId)])
      .then(([rfq, quotes]) => {
        setSelectedRfq(rfq);
        setQuotes(quotes);
      })
      .catch(() => {})
      .finally(() => setLoadingDetails(false));
  }, [selectedRfqId]);

  // Auto-select first RFQ
  useEffect(() => {
    if (rfqs.length > 0 && !selectedRfqId) {
      setSelectedRfqId(rfqs[0].id);
    }
  }, [rfqs, selectedRfqId]);

  const filteredRfqs = rfqs.filter((rfq) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = rfq.product?.name || rfq.unlistedItemDetails?.name || "";
    return name.toLowerCase().includes(q) || rfq.id.toLowerCase().includes(q);
  });

  const latestQuote = quotes.length > 0 ? quotes[quotes.length - 1] : null;

  const handleQuoteSuccess = (quote: Quote) => {
    setShowQuoteModal(false);
    setQuotes((prev) => [...prev, quote]);
    setSentQuote({ quote, rfq: selectedRfq! });
  };

  const handleOpenCreateQuote = () => {
    setQuoteModalMode("create");
    setShowQuoteModal(true);
  };

  const handleOpenUpdateQuote = () => {
    setQuoteModalMode("update");
    setShowQuoteModal(true);
  };

  const getStatusBadge = (rfq: RFQ) => {
    const hasQuotes = rfq.quotes && rfq.quotes.length > 0;
    switch (rfq.status) {
      case "OPEN":
        return hasQuotes
          ? { label: "QUOTE RCVD", bg: "bg-green-500 text-slate-900" }
          : { label: "PENDING", bg: "bg-slate-200 text-slate-600" };
      case "QUOTED":
        return { label: "QUOTED", bg: "bg-green-500 text-slate-900" };
      case "ACCEPTED":
        return { label: "ACCEPTED", bg: "bg-blue-500 text-white" };
      case "EXPIRED":
        return { label: "EXPIRED", bg: "bg-slate-100 text-slate-400 italic" };
      case "CANCELLED":
        return { label: "CANCELLED", bg: "bg-red-100 text-red-600" };
      default:
        return { label: rfq.status, bg: "bg-slate-200 text-slate-600" };
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-slate-900 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-1 font-black text-sm tracking-tighter">
            SWIFTTRADE
          </div>
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Negotiation Workspace
          </h1>
        </div>
      </header>

      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: RFQ Inbox */}
        <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
          {/* Search */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none text-slate-900 dark:text-white"
                placeholder="SEARCH RFQS..."
              />
            </div>
          </div>

          {/* RFQ List */}
          <div className="flex-1 overflow-y-auto">
            {filteredRfqs.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700 mb-4 block">
                  inbox
                </span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  No RFQs Found
                </p>
              </div>
            ) : (
              filteredRfqs.map((rfq) => {
                const isActive = rfq.id === selectedRfqId;
                const badge = getStatusBadge(rfq);
                const productName =
                  rfq.product?.name ||
                  rfq.unlistedItemDetails?.name ||
                  "Unlisted Item";
                const timeAgo = getTimeAgo(new Date(rfq.createdAt));

                return (
                  <div
                    key={rfq.id}
                    onClick={() => setSelectedRfqId(rfq.id)}
                    className={`border-b border-slate-100 dark:border-slate-800 p-4 cursor-pointer transition-colors ${
                      isActive
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-tighter ${
                          isActive
                            ? "text-green-400 dark:text-green-600"
                            : "text-slate-400"
                        }`}
                      >
                        {isActive ? "Active Thread" : timeAgo}
                      </span>
                      <span
                        className={`text-[9px] px-1 font-bold ${isActive ? badge.bg : badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <h3
                      className={`font-bold text-sm ${
                        rfq.status === "EXPIRED"
                          ? "text-slate-400"
                          : isActive
                            ? "text-white dark:text-slate-900"
                            : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {rfq.quantity} {rfq.product?.unit || "units"} —{" "}
                      {productName}
                    </h3>
                    <p
                      className={`text-[10px] mt-1 uppercase tracking-wide ${
                        isActive
                          ? "text-slate-400 dark:text-slate-500"
                          : "text-slate-400"
                      }`}
                    >
                      Ref: #RFQ-{rfq.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* CENTER: Conversation Thread */}
        <main className="flex-1 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-w-0">
          {selectedRfq ? (
            <>
              {/* Thread Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">
                      storefront
                    </span>
                  </div>
                  <div>
                    <h2 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">
                      {selectedRfq.merchant?.businessName || "Buyer Request"}
                    </h2>
                    <p className="text-[10px] text-green-500 font-bold flex items-center gap-1 uppercase">
                      <span className="h-1.5 w-1.5 bg-green-500 block"></span>{" "}
                      Online & Verified
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
                    View History
                  </button>
                  <button className="border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Export PDF
                  </button>
                </div>
              </div>

              {/* Conversation Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 dark:bg-slate-900/50">
                {/* Date Divider */}
                <div className="flex justify-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-700 pb-1">
                    Negotiation Opened:{" "}
                    {new Date(selectedRfq.createdAt).toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" },
                    )}
                  </span>
                </div>

                {/* Buyer's Request Message */}
                <div className="flex flex-col items-start max-w-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Contractor (Buyer)
                    </span>
                    <span className="text-[9px] text-slate-300">
                      {new Date(selectedRfq.createdAt).toLocaleTimeString(
                        "en-US",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {selectedRfq.notes ||
                        `I need ${selectedRfq.quantity} ${selectedRfq.product?.unit || "units"} of ${selectedRfq.product?.name || selectedRfq.unlistedItemDetails?.name || "the requested item"} delivered to ${selectedRfq.deliveryAddress}.`}
                    </p>
                  </div>
                </div>

                {/* Quote Card (if quote exists) */}
                {latestQuote && (
                  <div className="flex flex-col items-end w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] text-slate-300">
                        {new Date(latestQuote.createdAt).toLocaleTimeString(
                          "en-US",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                        Your Quote
                      </span>
                    </div>
                    <div className="w-full max-w-md">
                      <div className="bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)]">
                        <div className="bg-slate-900 dark:bg-slate-100 p-3 flex justify-between items-center">
                          <h3 className="text-[10px] font-black text-white dark:text-slate-900 uppercase tracking-[0.2em]">
                            Official Quote #
                            {latestQuote.id.slice(0, 8).toUpperCase()}
                          </h3>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono tracking-tighter">
                            {new Date(
                              latestQuote.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-baseline border-b border-slate-100 dark:border-slate-700 pb-2">
                              <span className="text-[11px] font-bold text-slate-500 uppercase">
                                Unit Price ({selectedRfq.quantity}{" "}
                                {selectedRfq.product?.unit || "units"})
                              </span>
                              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                                {formatKobo(BigInt(latestQuote.unitPriceKobo))}{" "}
                                / {selectedRfq.product?.unit || "unit"}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline border-b border-slate-100 dark:border-slate-700 pb-2">
                              <span className="text-[11px] font-bold text-slate-500 uppercase">
                                Delivery Fee
                              </span>
                              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                                {formatKobo(
                                  BigInt(latestQuote.deliveryFeeKobo),
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline pt-2">
                              <span className="text-sm font-black uppercase text-slate-900 dark:text-white">
                                Total Amount
                              </span>
                              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                {formatKobo(BigInt(latestQuote.totalPriceKobo))}
                              </span>
                            </div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900 p-3 flex items-center gap-3">
                            <div className="h-2 w-2 bg-green-500 animate-pulse"></div>
                            <p className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest">
                              Expiry:{" "}
                              {new Date(
                                latestQuote.validUntil,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Update Quote button */}
                      <button
                        onClick={handleOpenUpdateQuote}
                        className="w-full mt-3 border-2 border-slate-600 dark:border-slate-400 text-slate-600 dark:text-slate-400 text-xs font-black py-3 uppercase tracking-[0.15em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Update Quote
                      </button>
                    </div>
                  </div>
                )}

                {/* No Quote Yet — Show Create Button */}
                {!latestQuote && !loadingDetails && (
                  <div className="flex justify-center py-8">
                    <button
                      onClick={handleOpenCreateQuote}
                      className="bg-green-500 text-white text-xs font-black py-4 px-12 uppercase tracking-[0.2em] hover:bg-green-600 border border-slate-900 dark:border-slate-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] transition-transform active:translate-y-0.5 active:shadow-none"
                    >
                      Create Official Quote
                    </button>
                  </div>
                )}

                {loadingDetails && (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>

              {/* Bottom Message Bar (UI-only) */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex gap-4 items-center">
                  <div className="flex-1 relative">
                    <textarea
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm py-4 px-5 pr-16 focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none font-medium resize-none text-slate-900 dark:text-white"
                      placeholder="REPLY TO MERCHANT OR COUNTER-OFFER..."
                      rows={1}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                      <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        <span className="material-symbols-outlined text-xl">
                          attach_file
                        </span>
                      </button>
                      <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        <span className="material-symbols-outlined text-xl">
                          image
                        </span>
                      </button>
                    </div>
                  </div>
                  <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-14 w-14 flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shrink-0">
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700 mb-4 block">
                  forum
                </span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Select an RFQ to begin
                </p>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT: Merchant Details / RFQ Details */}
        <aside className="w-80 bg-slate-50 dark:bg-slate-900 flex flex-col shrink-0 overflow-y-auto border-l border-slate-200 dark:border-slate-800 hidden xl:flex">
          {selectedRfq ? (
            <div className="p-6 space-y-8">
              {/* Merchant Credentials */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                  Request Details
                </h4>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-700 p-2 border border-slate-200 dark:border-slate-600">
                      <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-lg">
                        verified
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-slate-900 dark:text-white">
                        {selectedRfq.product?.name ||
                          selectedRfq.unlistedItemDetails?.name ||
                          "Unlisted Item"}
                      </p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-tighter">
                        {selectedRfq.quantity}{" "}
                        {selectedRfq.product?.unit || "units"} requested
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      Status:
                    </span>
                    <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white">
                      {selectedRfq.status}
                    </span>
                  </div>
                </div>
              </section>

              {/* Delivery Location */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                  Delivery Location
                </h4>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <div className="h-32 bg-slate-200 dark:bg-slate-700 relative overflow-hidden flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">
                      map
                    </span>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="material-symbols-outlined text-red-600 drop-shadow-md">
                        location_on
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800">
                    <p className="text-[11px] font-bold uppercase mb-1 text-slate-900 dark:text-white">
                      {selectedRfq.deliveryAddress}
                    </p>
                    <p className="text-[9px] text-slate-400 leading-tight">
                      Contractor Drop-off Point
                    </p>
                  </div>
                </div>
              </section>

              {/* Attachments Placeholder */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                  Attachments
                </h4>
                <div className="space-y-2">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between group cursor-pointer hover:border-slate-400 dark:hover:border-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-lg">
                        description
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-tight text-slate-700 dark:text-slate-300">
                        Technical_Specs.pdf
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                      download
                    </span>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                  <span>Encryption: Active</span>
                  <span>ID: {selectedRfq.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                No RFQ Selected
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Modals */}
      {showQuoteModal && selectedRfq && (
        <QuoteModal
          mode={quoteModalMode}
          rfq={selectedRfq}
          existingQuote={quoteModalMode === "update" ? latestQuote : null}
          onSuccess={handleQuoteSuccess}
          onClose={() => setShowQuoteModal(false)}
        />
      )}
      {sentQuote && (
        <QuoteSentModal
          quote={sentQuote.quote}
          rfq={sentQuote.rfq}
          onReturnToWorkspace={() => setSentQuote(null)}
          onClose={() => setSentQuote(null)}
        />
      )}
    </div>
  );
}

// Utility: human-readable time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return days === 1 ? "Yesterday" : `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}
