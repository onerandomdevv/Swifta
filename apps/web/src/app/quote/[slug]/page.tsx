"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface SharedQuoteItem {
  productName: string;
  quantity: number;
  unitPriceKobo: number;
  totalKobo: number;
}

interface SharedQuotePublic {
  id: string;
  slug: string;
  buyerName?: string;
  items: SharedQuoteItem[];
  subtotalKobo: number;
  deliveryFeeKobo: number;
  totalKobo: number;
  note?: string;
  status: string;
  expiresAt: string;
  viewedAt?: string;
  merchantProfile?: {
    businessName: string;
    verification: string;
  };
}

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function PublicQuotePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<SharedQuotePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${apiUrl}/quotes/shared/${slug}/public`, { credentials: "include" })
      .then(async (res) => {
        if (res.status === 410) {
          setExpired(true);
          return;
        }
        if (!res.ok) throw new Error("Quote not found");
        const json = await res.json();
        setQuote(json.data || json);
      })
      .catch(() => setError("Quote not found or has been removed."))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAccept = () => {
    // TODO: Full flow — if logged in, create order from shared quote.
    // For now, redirect to registration with redirect back to this page.
    router.push(`/register?redirect=/quote/${slug}&role=BUYER`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="bg-white border-2 border-slate-900 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">
              timer_off
            </span>
            <h1 className="text-lg font-black uppercase tracking-tight text-slate-900">
              Quote Expired
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              This quote is no longer valid. Please contact the merchant for an
              updated quote.
            </p>
          </div>
          <a
            href="/"
            className="inline-block bg-slate-900 text-white py-3 px-8 text-xs font-black uppercase tracking-[0.15em] hover:bg-slate-800 transition-colors"
          >
            Visit Hardware OS
          </a>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="bg-white border-2 border-slate-900 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">
              error
            </span>
            <h1 className="text-lg font-black uppercase tracking-tight text-slate-900">
              Quote Not Found
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {error || "This quote link may be invalid or has been removed."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isVerified = quote.merchantProfile?.verification === "VERIFIED";
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(quote.expiresAt).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white py-3 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-green-500 h-2 w-2 block animate-pulse"></span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            Secured by Hardware OS
          </span>
        </div>
        <span className="text-[9px] font-mono text-slate-400 tracking-tighter">
          REF: {quote.slug}
        </span>
      </div>

      <div className="max-w-lg mx-auto p-6 space-y-6 animate-in fade-in duration-500">
        {/* Merchant Header */}
        <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
          <div className="bg-slate-900 p-4 flex items-center justify-between">
            <h1 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
              Official Quote
            </h1>
            <span className="text-[9px] text-slate-400 font-mono">
              {new Date().toLocaleDateString()}
            </span>
          </div>
          <div className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 bg-slate-100 border border-slate-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-600">
                storefront
              </span>
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-tight text-slate-900">
                {quote.merchantProfile?.businessName || "Hardware Merchant"}
              </h2>
              {isVerified && (
                <p className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">
                    verified
                  </span>{" "}
                  Verified Merchant
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Buyer Name */}
        {quote.buyerName && (
          <div className="bg-white border border-slate-200 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Prepared For
            </p>
            <p className="text-sm font-bold text-slate-900">
              {quote.buyerName}
            </p>
          </div>
        )}

        {/* Items Table */}
        <div className="bg-white border-2 border-slate-200">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 grid grid-cols-[1fr_60px_90px_90px] gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
            <span>Product</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Unit Price</span>
            <span className="text-right">Total</span>
          </div>
          {(quote.items as SharedQuoteItem[]).map((item, i) => (
            <div
              key={i}
              className="px-5 py-3 border-b border-slate-100 grid grid-cols-[1fr_60px_90px_90px] gap-2 items-center"
            >
              <span className="text-sm font-bold text-slate-900">
                {item.productName}
              </span>
              <span className="text-sm text-slate-500 text-center">
                {item.quantity}
              </span>
              <span className="text-sm font-mono text-slate-700 text-right">
                {formatNaira(item.unitPriceKobo)}
              </span>
              <span className="text-sm font-mono font-bold text-slate-900 text-right">
                {formatNaira(item.totalKobo)}
              </span>
            </div>
          ))}

          {/* Totals */}
          <div className="px-5 py-3 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                Subtotal
              </span>
              <span className="font-mono font-bold text-sm text-slate-700">
                {formatNaira(quote.subtotalKobo)}
              </span>
            </div>
            {quote.deliveryFeeKobo > 0 && (
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Delivery Fee
                </span>
                <span className="font-mono font-bold text-sm text-slate-700">
                  {formatNaira(quote.deliveryFeeKobo)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-3 border-t border-slate-200">
              <span className="text-sm font-black uppercase text-slate-900">
                Total Due
              </span>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                {formatNaira(quote.totalKobo)}
              </span>
            </div>
          </div>
        </div>

        {/* Merchant Note */}
        {quote.note && (
          <div className="bg-white border border-slate-200 p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Note from Merchant
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {quote.note}
            </p>
          </div>
        )}

        {/* Expiry */}
        <div className="bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <div className="h-2 w-2 bg-green-500 animate-pulse"></div>
          <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">
            Valid for {daysLeft} day{daysLeft !== 1 ? "s" : ""} — Expires{" "}
            {new Date(quote.expiresAt).toLocaleDateString()}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleAccept}
          className="w-full bg-green-500 text-white py-5 text-sm font-black uppercase tracking-[0.2em] hover:bg-green-600 transition-colors border border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.08)] active:translate-y-0.5 active:shadow-none"
        >
          Accept & Pay Securely
        </button>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Escrow-protected payment · Powered by Hardware OS
          </p>
        </div>
      </div>
    </div>
  );
}
