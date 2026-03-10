"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatKobo } from "@hardware-os/shared";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/providers/toast-provider";
import { getRFQ, updateRFQ, deleteRFQ } from "@/lib/api/rfq.api";
import { getQuotesByRFQ, acceptQuote } from "@/lib/api/quote.api";
import type { RFQ, Quote } from "@hardware-os/shared";

// Extracted Components
import { BuyerRFQSummary, BuyerQuotesList } from "@/components/buyer/rfqs";

export default function BuyerRFQDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    quantity: 1,
    deliveryAddress: "",
    notes: "",
  });

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
        setError(err?.message || "Failed to load RFQ details");
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
      toast.success("Quote accepted successfully!");
      router.push("/buyer/orders");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to accept quote");
      setAcceptingId(null);
    }
  };

  const startEditing = () => {
    if (rfq) {
      setEditData({
        quantity: rfq.quantity,
        deliveryAddress: rfq.deliveryAddress,
        notes: rfq.notes || "",
      });
      setIsEditing(true);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updated = await updateRFQ(id as string, editData);
      setRfq(updated);
      setIsEditing(false);
      toast.success("RFQ updated successfully!");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update RFQ");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to completely delete this RFQ?"))
      return;
    try {
      setIsDeleting(true);
      await deleteRFQ(id as string);
      toast.success("RFQ deleted successfully.");
      router.push("/buyer/rfqs");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete RFQ");
      setIsDeleting(false);
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
        <span className="material-symbols-outlined text-5xl text-red-400">
          error
        </span>
        <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
          {error || "RFQ not found"}
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-6">
        <button
          onClick={() => router.back()}
          className="size-12 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
            RFQ Details
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">
            Reference: {rfq.id.slice(0, 8)} &bull; Submitted{" "}
            {new Date(rfq.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-10">
          {isEditing ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm animate-in fade-in duration-300">
              <div className="mb-8 pb-4 border-b border-slate-50 dark:border-slate-800">
                <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
                  Edit Request Details
                </h3>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editData.quantity}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 px-6 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    required
                    value={editData.deliveryAddress}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        deliveryAddress: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 px-6 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                    Notes
                  </label>
                  <textarea
                    value={editData.notes}
                    onChange={(e) =>
                      setEditData({ ...editData, notes: e.target.value })
                    }
                    className="w-full h-32 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 px-6 text-sm font-bold text-navy-dark dark:text-white outline-none focus:border-primary transition-all resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-navy-dark dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-navy-dark text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-navy-dark/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <BuyerRFQSummary
              rfq={rfq}
              onEdit={startEditing}
              onDelete={handleDelete}
            />
          )}
        </div>

        <div className="lg:col-span-5">
          <BuyerQuotesList
            quotes={quotes}
            acceptingId={acceptingId}
            onAcceptQuote={handleAcceptQuote}
          />
        </div>
      </div>
    </div>
  );
}
