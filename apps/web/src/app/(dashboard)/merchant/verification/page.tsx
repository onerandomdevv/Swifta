"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { getProfile } from "@/lib/api/merchant.api";
import {
  getVerificationStatus,
  submitVerificationRequest,
} from "@/lib/api/merchant.api";

export default function MerchantVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [verificationData, setVerificationData] = useState<any>(null);

  // Form State
  const [idType, setIdType] = useState("NIN");
  const [idUrl, setIdUrl] = useState("");
  const [cacUrl, setCacUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [profRes, verRes] = await Promise.allSettled([
          getProfile(),
          getVerificationStatus(),
        ]);
        if (profRes.status === "fulfilled") setProfile(profRes.value);
        if (verRes.status === "fulfilled") setVerificationData(verRes.value);
      } catch (err) {
        console.error("Failed to load verification data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idUrl) {
      setError("Please provide a valid Government ID Link (Cloudinary expected)");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitVerificationRequest({
        idType,
        governmentIdUrl: idUrl,
        cacCertUrl: cacUrl || undefined,
      });
      const newStatus = await getVerificationStatus();
      setVerificationData(newStatus);
      setSubmitting(false);
    } catch (err: any) {
      setError(err?.error || err?.message || "Failed to submit verification request");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
        <div className="space-y-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-12 w-96 rounded-xl" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-64 w-full rounded-[2rem]" />
        </div>
      </div>
    );
  }

  const {
    businessName,
    cacNumber,
    bankAccountNo,
    onboardingStep,
  } = profile || {};

  const tier = verificationData?.tier || "UNVERIFIED";
  const pendingRequest = verificationData?.pendingRequest;

  const isIncomplete =
    !profile || onboardingStep < 5 || !cacNumber || !bankAccountNo;

  const getTierColor = (t: string) => {
    switch (t) {
      case "TRUSTED":
        return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800";
      case "VERIFIED":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
      case "BASIC":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">
            Trust & Verification
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide">
            Secure your merchant account to enable Direct Payments and higher trust.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Current Tier
          </p>
          <div
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-dashed ${getTierColor(
              tier
            )}`}
          >
            {tier}
          </div>
        </div>
      </div>

      {isIncomplete ? (
        <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-100 dark:border-amber-900/20 rounded-[2rem] p-8 text-center space-y-6">
          <div className="size-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-tight">
              Profile Incomplete
            </h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto font-medium leading-relaxed">
              You must complete your business profile, including bank details
              and KYC data, before your account can submit documents for verification.
            </p>
          </div>
          <Link
            href="/merchant/dashboard"
            className="inline-block px-8 py-4 bg-navy-dark dark:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all active:scale-95"
          >
            Complete Onboarding Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {tier === "VERIFIED" || tier === "TRUSTED" ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/20 rounded-[2rem] p-8 text-center space-y-6">
              <div className="size-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                <span className="material-symbols-outlined text-3xl">verified</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">
                  You are {tier}
                </h2>
                <p className="text-emerald-600 dark:text-emerald-500 text-sm max-w-lg mx-auto font-medium leading-relaxed">
                  Congratulations! Your documents have been approved and you've met the platform requirements.
                  You can now accept Direct Payments from buyers.
                </p>
              </div>
            </div>
          ) : pendingRequest ? (
            <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-900/20 rounded-[2rem] p-8 text-center space-y-6">
              <div className="size-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-blue-800 dark:text-blue-400 uppercase tracking-tight">
                  Verification Pending
                </h2>
                <p className="text-blue-600 dark:text-blue-500 text-sm max-w-lg mx-auto font-medium leading-relaxed">
                  We have received your verification documents. Our team is currently reviewing them. 
                  This usually takes 24-48 hours.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
                  Submit Verification Documents
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                  Reach VERIFIED status to unlock Direct Payments (1% fee)
                </p>
              </div>
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl text-sm font-bold border border-red-100 dark:border-red-900/30">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
                      Government ID Type
                    </label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-navy-dark dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                    >
                      <option value="NIN">National Identity Number (NIN)</option>
                      <option value="VOTERS_CARD">Voter's Card</option>
                      <option value="PASSPORT">International Passport</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
                      Government ID Document URL (Cloudinary)
                    </label>
                    <input
                      type="url"
                      placeholder="https://res.cloudinary.com/..."
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-navy-dark dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                      value={idUrl}
                      onChange={(e) => setIdUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
                      CAC Certificate URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://res.cloudinary.com/..."
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-navy-dark dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                      value={cacUrl}
                      onChange={(e) => setCacUrl(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Speeds up approval process
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !idUrl}
                    className="w-full py-4 bg-navy-dark dark:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none mt-8"
                  >
                    {submitting ? "Submitting..." : "Submit Documents"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
