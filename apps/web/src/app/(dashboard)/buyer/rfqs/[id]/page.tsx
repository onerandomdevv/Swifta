'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatKobo } from '@hardware-os/shared';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getRFQ } from '@/lib/api/rfq.api';
import { getQuotesByRFQ, acceptQuote } from '@/lib/api/quote.api';
import type { RFQ, Quote } from '@hardware-os/shared';

export default function BuyerRFQDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [rfqData, quotesData] = await Promise.all([
          getRFQ(id as string),
          getQuotesByRFQ(id as string),
        ]);
        setRfq(rfqData as any as RFQ);
        setQuotes(Array.isArray(quotesData) ? quotesData : []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load RFQ details');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleAcceptQuote = async (quoteId: string) => {
    setAcceptingId(quoteId);
    try {
      await acceptQuote(quoteId);
      router.push('/buyer/orders');
    } catch (err: any) {
      setError(err?.message || 'Failed to accept quote');
      setAcceptingId(null);
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
            <Skeleton className="h-[500px] w-full rounded-[2.5rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">{error || 'RFQ not found'}</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-6">
        <button onClick={() => router.back()} className="size-12 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">RFQ Details</h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Reference: {rfq.id.slice(0, 8)} &bull; Submitted {new Date(rfq.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50 dark:border-slate-800">
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Request Details</h3>
              <StatusBadge status={rfq.status} />
            </div>
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity</p>
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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes</p>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{rfq.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm sticky top-10">
            <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-50 dark:border-slate-800">
              <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">Received Quotes</h3>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">{quotes.length} Responses</span>
            </div>

            {quotes.length > 0 ? (
              <div className="space-y-6">
                {quotes.map((quote) => (
                  <div key={quote.id} className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-navy-dark dark:hover:border-white transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-tight">Quote {quote.id.slice(0, 8)}</p>
                        <StatusBadge status={quote.status} className="mt-1 text-[8px]" />
                      </div>
                      <p className="text-lg font-black text-navy-dark dark:text-white tabular-nums">{formatKobo(BigInt(quote.totalPriceKobo))}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit: {formatKobo(BigInt(quote.unitPriceKobo))}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Delivery Fee: {formatKobo(BigInt(quote.deliveryFeeKobo))}</p>
                      </div>
                      {quote.status === 'PENDING' && (
                        <button
                          onClick={() => handleAcceptQuote(quote.id)}
                          disabled={acceptingId === quote.id}
                          className="px-4 py-2 bg-navy-dark text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {acceptingId === quote.id ? 'Accepting...' : 'Accept Quote'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-4xl text-slate-200 mb-4">hourglass_empty</span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting merchant quotes</p>
              </div>
            )}

            <p className="mt-10 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60 leading-relaxed">
              Accepting a quote will automatically generate a purchase order and initiate the escrow process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
