"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPublicProfile } from "@/lib/api/merchant.api";
import { getPublicProductsByMerchant } from "@/lib/api/product.api";
import { getMerchantReviews } from "@/lib/api/review.api";
import type { MerchantProfile, Product, Review } from "@hardware-os/shared";
import { Button } from "@/components/ui/button";
import { CatalogueGrid } from "@/components/buyer/catalogue/catalogue-grid";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { StarRating } from "@/components/ui/star-rating";

const DEFAULT_CATEGORY = "General Trade";

export default function BuyerMerchantProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setError("");
        setLoading(true);
        const profileData = await getPublicProfile(id as string);
        const productsData = await getPublicProductsByMerchant(id as string);
        if (active) {
          setProfile(profileData);
          setProducts(productsData as unknown as Product[]);
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || "Failed to load merchant profile");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchData();
    }
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      setReviewsError(null);
      try {
        const reviewsData = await getMerchantReviews(id as string, 1, 10);
        if (active) setReviews(reviewsData);
      } catch (revErr: any) {
        console.error("Failed to load reviews:", revErr);
        if (active) setReviewsError("Failed to load reviews");
      } finally {
        if (active) setReviewsLoading(false);
      }
    };

    if (id) {
      fetchReviews();
    }
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Loading Trust Profile...
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-20 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-red-400">
          error
        </span>
        <h2 className="text-xl font-bold text-slate-900">Profile Not Found</h2>
        <p className="text-slate-500">
          {error || "This merchant profile could not be loaded."}
        </p>
        <Button onClick={() => router.back()} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900 animate-in fade-in duration-700">
      {/* Hero Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                <div className="size-16 sm:size-20 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-3xl sm:text-4xl">
                    storefront
                  </span>
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <h1 className="text-2xl sm:text-4xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
                      {profile.businessName}
                    </h1>
                    {profile.verificationTier && (
                      <div className="scale-110 sm:scale-125 sm:origin-left">
                        <VerificationBadge tier={profile.verificationTier} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                      {profile.category || DEFAULT_CATEGORY} • EST.{" "}
                      {profile.estYear || "N/A"}
                    </p>
                    {(profile.averageRating ?? 0) > 0 && (
                      <div className="flex items-center gap-2 sm:pl-4 sm:border-l border-slate-200 dark:border-slate-800">
                        <StarRating
                          rating={profile.averageRating ?? 0}
                          readOnly
                          size="sm"
                        />
                        <span className="text-[10px] font-black text-navy-dark dark:text-white uppercase tracking-widest mt-0.5">
                          {profile.reviewCount} REVIEWS
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {profile.contact?.phone && (
                <a
                  href={`https://wa.me/${profile.contact.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 h-12 px-6 bg-[#25D366] text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:opacity-90 transition-all shadow-lg shadow-green-500/10 active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">
                    chat_bubble
                  </span>
                  WhatsApp Trade
                </a>
              )}
              <div className="grid grid-cols-2 sm:flex gap-3">
                <Button
                  variant="outline"
                  className="font-black uppercase tracking-widest text-[10px] h-12 px-4 sm:px-6 rounded-xl border-slate-200 dark:border-slate-700 active:scale-95"
                  onClick={() => router.back()}
                >
                  Back
                </Button>
                <Button
                  className="font-black uppercase tracking-widest text-[10px] h-12 px-4 sm:px-6 rounded-xl shadow-lg shadow-primary/10 bg-primary hover:bg-orange-600 transition-all active:scale-95"
                  onClick={() => {
                    document
                      .getElementById("products-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Showcase
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12">
        {/* Profile Details Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Business Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
              <h2 className="text-xs sm:text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest sm:tracking-[0.2em] mb-6 sm:mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg sm:text-xl">
                  verified_user
                </span>
                Merchant Credentials
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 sm:gap-y-10 gap-x-12">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Business Type
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">
                    {profile.businessType || "Not Specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Industry
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {profile.category || DEFAULT_CATEGORY}
                  </p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Address
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    {profile.businessAddress || "Lagos, Nigeria"}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 md:col-span-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Member Since
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      {new Date(profile.createdAt).getFullYear()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Trust Level
                    </p>
                    <VerificationBadge tier={profile.verificationTier} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logistics Overview */}
          {/* Logistics Overview */}
          <div className="space-y-6">
            <div className="bg-navy-dark dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] text-white shadow-xl border border-white/5">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest sm:tracking-[0.2em] mb-6 sm:mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  local_shipping
                </span>
                Logistics Capacity
              </h2>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-6 sm:gap-8">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white/60 text-lg">
                      warehouse
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                      Warehouse
                    </p>
                    <p className="text-[11px] sm:text-sm font-bold mt-0.5">
                      {profile.warehouseLocation || "Lagos, Nigeria"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white/60 text-lg">
                      hub
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                      Distribution
                    </p>
                    <p className="text-[11px] sm:text-sm font-bold mt-0.5">
                      {profile.distributionCenter || "Central Hub"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-[9px] font-medium text-white/40 leading-relaxed italic">
                  *Verified regularly by SwiftTrade agents.
                </p>
              </div>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
                  Buyer Feedback
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Recent trades with {profile.businessName}
                </p>
              </div>
              {(profile.averageRating ?? 0) > 0 && (
                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 w-fit">
                  <div className="text-right">
                    <p className="text-2xl font-black text-navy-dark dark:text-white leading-none">
                      {Number(profile.averageRating ?? 0).toFixed(1)}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Platform Rating
                    </p>
                  </div>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-12 text-center space-y-4 shadow-sm">
                <span className="material-symbols-outlined text-4xl text-slate-200">
                  rate_review
                </span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No verified reviews yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <StarRating rating={rev.rating} readOnly size="sm" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      "{rev.comment || "No comment provided."}"
                    </p>
                    <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-700/50 flex items-center gap-2">
                      <div className="size-5 bg-navy-dark/10 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[10px] text-navy-dark">
                          person
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-navy-dark dark:text-white uppercase tracking-widest">
                        Verified Buyer
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Products Section */}
        <section id="products-section" className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
                Product Showcase
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                Active listings available for immediate quote requests
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Available Items: {products.length}
              </span>
            </div>
          </div>

          <CatalogueGrid
            products={products}
            setSearchQuery={() => {}}
            setActiveCategory={() => {}}
          />
        </section>
      </div>
    </div>
  );
}
