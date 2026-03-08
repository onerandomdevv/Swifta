"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StarRating } from "@/components/ui/star-rating";
import { getOrder } from "@/lib/api/order.api";
import { createReview, getOrderReview } from "@/lib/api/review.api";
import type { Order, Review } from "@hardware-os/shared";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const orderData = await getOrder(id as string);
        const o = (orderData as any).data || orderData;
        setOrder(o);

        // Fetch review separately
        try {
          const reviewData = await getOrderReview(id as string);
          setExistingReview(reviewData);
          if (reviewData) {
            setRating(reviewData.rating);
            setComment(reviewData.comment || "");
          }
        } catch (revErr) {
          console.error("Failed to load existing review:", revErr);
          setExistingReview(null);
        }
      } catch (err: any) {
        setError(err?.error || err?.message || "Failed to load order info");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setSubmitting(true);
    setError(null);
    try {
      await createReview({
        orderId: order.id,
        rating,
        comment: comment.trim() || undefined,
      });
      router.push(`/buyer/orders/${order.id}?reviewed=true`);
    } catch (err: any) {
      setError(err?.error || err?.message || "Failed to submit review");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-8">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-[2.5rem]" />
      </div>
    );
  }

  if (
    !order ||
    (order.status !== "COMPLETED" && order.status !== "DELIVERED")
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <span className="material-symbols-outlined text-5xl text-amber-400">
          warning
        </span>
        <h2 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
          Cannot Review Yet
        </h2>
        <p className="max-w-sm text-slate-500 font-bold text-sm tracking-wide leading-relaxed uppercase">
          Reviews can only be submitted for completed orders.
        </p>
        <button
          onClick={() => router.back()}
          className="px-8 py-4 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="size-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">
              arrow_back
            </span>
          </button>
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
            Rate Experience
          </h1>
        </div>
        <p className="text-slate-500 font-bold text-sm tracking-wide ml-14 uppercase">
          Order #{order.id.slice(0, 8)} •{" "}
          {order.product?.name || "Multiple Items"}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 md:p-14 space-y-10 shadow-2xl shadow-navy-dark/5"
      >
        <div className="space-y-6 text-center">
          <p className="text-xs font-black text-navy-dark/40 dark:text-white/40 uppercase tracking-[0.2em]">
            {existingReview
              ? "Your review has been saved"
              : "How was your purchase?"}
          </p>
          <StarRating
            rating={rating}
            onRatingChange={setRating}
            readOnly={!!existingReview}
            size="lg"
            className="justify-center"
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-navy-dark dark:text-white uppercase tracking-[0.2em] ml-2">
            Share more details (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!!existingReview}
            placeholder="Tell us about the quality, delivery speed, or communication..."
            className="w-full h-40 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 text-sm outline-none focus:border-navy-dark dark:focus:border-white transition-all resize-none disabled:opacity-60"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex gap-3 items-center">
            <span className="material-symbols-outlined text-red-500 text-sm">
              error
            </span>
            <p className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest">
              {error}
            </p>
          </div>
        )}

        {!existingReview && (
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-16 bg-navy-dark text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all shadow-xl shadow-navy-dark/20"
          >
            {submitting ? "Submitting..." : "Post Review"}
          </button>
        )}

        {existingReview && (
          <div className="text-center">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
              Review submitted on{" "}
              {new Date(existingReview.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
