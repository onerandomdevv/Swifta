"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { merchantApi } from "@/lib/api/merchant.api";
import { useToast } from "@/providers/toast-provider";
import { MerchantProfile, VerificationTier } from "@swifta/shared";

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | "NONE";

function getTierLabel(tier: VerificationTier) {
  switch (tier) {
    case VerificationTier.BASIC: return "Basic";
    case VerificationTier.VERIFIED: return "Verified";
    case VerificationTier.TRUSTED: return "Trusted Partner";
    default: return "Unverified";
  }
}

function getTierBadgeStyle(tier: VerificationTier) {
  switch (tier) {
    case VerificationTier.BASIC: return "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
    case VerificationTier.VERIFIED: return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
    case VerificationTier.TRUSTED: return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
    default: return "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
  }
}

export default function MerchantVerificationPage() {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [tier, setTier] = useState<VerificationTier>(VerificationTier.UNVERIFIED);
  const [status, setStatus] = useState<VerificationStatus>("NONE");
  const [loading, setLoading] = useState(true);

  // Form state
  const [idType, setIdType] = useState("");
  const [idUrl, setIdUrl] = useState("");
  const [cacNumber, setCacNumber] = useState("");
  const [cacUrl, setCacUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [isUploadingCac, setIsUploadingCac] = useState(false);

  const idInputRef = useRef<HTMLInputElement>(null);
  const cacInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([merchantApi.getProfile(), merchantApi.getVerificationStatus()])
      .then(([p, v]) => {
        setProfile(p);
        setTier(v.tier as VerificationTier);
        setStatus((v.pendingRequest?.status || "NONE") as VerificationStatus);
        setCacNumber(p.cacNumber || "");
        setCacUrl(v.pendingRequest?.cacCertUrl || p.cacDocumentUrl || "");
        setIdUrl(v.pendingRequest?.governmentIdUrl || "");
        if (v.pendingRequest?.idType) setIdType(v.pendingRequest.idType);
      })
      .catch((err) => {
        console.error("Failed to load verification info:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (file: File, type: "ID" | "CAC") => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be under 2MB");
      return;
    }

    try {
      if (type === "ID") setIsUploadingId(true);
      else setIsUploadingCac(true);

      const res = await merchantApi.uploadDocument(file);
      if (type === "ID") setIdUrl(res.url);
      else setCacUrl(res.url);

      toast.success(`${type} document uploaded successfully`);
    } catch (err: any) {
      toast.error(err?.message || `Failed to upload ${type}`);
    } finally {
      if (type === "ID") setIsUploadingId(false);
      else setIsUploadingCac(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idType || !idUrl) {
      toast.error("Please provide ID type and upload your document.");
      return;
    }
    setSubmitting(true);
    try {
      if (cacNumber && cacNumber !== profile?.cacNumber) {
        await merchantApi.updateProfile({ cacNumber });
      }

      await merchantApi.submitVerificationRequest({
        idType,
        governmentIdUrl: idUrl,
        cacCertUrl: cacUrl || undefined,
      });

      toast.success("Verification submitted successfully!");
      setStatus("PENDING");
    } catch (err: any) {
      toast.error(err?.message || "Verification submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background-light dark:bg-background-dark min-h-[60vh] space-y-4">
        <div className="size-12 border-4 border-slate-100 dark:border-slate-800 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading verification...</p>
      </div>
    );
  }

  const isProfileIncomplete = !profile?.businessName || !profile?.bankAccountNumber;

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display text-slate-900 dark:text-slate-100">
      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/merchant/dashboard" className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
            <span className="text-slate-900 dark:text-white text-sm font-semibold">Business Verification</span>
          </div>

          <div className="flex flex-wrap justify-between items-end gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-emerald-500 text-sm font-bold uppercase tracking-wider">Trust & Verification</p>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-slate-900 dark:text-white text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
                  Business <span className="text-emerald-500">Verification</span>
                </h1>
                <span className={`px-3 py-1 ${getTierBadgeStyle(tier)} text-xs font-bold rounded-full uppercase tracking-widest`}>
                  {getTierLabel(tier)}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 cursor-pointer rounded-xl h-11 px-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {isProfileIncomplete ? (
              /* Profile Incomplete State */
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">contact_mail</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Profile Incomplete</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                      Complete your business profile and add your bank account before starting the verification process.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/merchant/settings")}
                  className="bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg"
                >
                  Complete Profile
                </button>
              </div>
            ) : status === "PENDING" ? (
              /* Verification Pending State */
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center space-y-6">
                <div className="size-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <span className="material-symbols-outlined text-4xl text-blue-600 dark:text-blue-400">update</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Verification Under Review</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Our team is reviewing your submitted documents. This usually takes 24–48 business hours.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest">
                  <div className="size-1.5 bg-blue-500 rounded-full animate-ping" />
                  Reviewing Documents
                </div>
              </div>
            ) : (
              /* Verification Form */
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-slate-900 dark:text-white text-xl font-bold">Verification Requirements</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Please provide the following information to verify your business identity.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-10">
                  {/* Step 1: Identity Verification */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-8 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-sm">1</div>
                      <h3 className="text-slate-900 dark:text-white font-bold text-lg">Identity Verification</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-0 sm:pl-11">
                      <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Identity Document Type</label>
                        <select
                          value={idType}
                          onChange={(e) => setIdType(e.target.value)}
                          className="form-select w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                        >
                          <option value="">Select ID Type</option>
                          <option value="NATIONAL_ID">National ID Card (NIN)</option>
                          <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
                          <option value="PASSPORT">International Passport</option>
                          <option value="VOTERS_CARD">Voter&apos;s Card</option>
                        </select>
                      </div>
                    </div>

                    {/* ID Upload Zone */}
                    <div className="pl-0 sm:pl-11">
                      <div
                        onClick={() => !isUploadingId && idInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-xl p-8 transition-all group cursor-pointer ${
                          idUrl
                            ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center text-center">
                          {idUrl ? (
                            <>
                              <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">check_circle</span>
                              <p className="text-emerald-600 dark:text-emerald-400 font-semibold">Identity Document Uploaded</p>
                              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Click to replace</p>
                            </>
                          ) : isUploadingId ? (
                            <>
                              <div className="size-8 border-3 border-slate-200 border-t-primary rounded-full animate-spin mb-2" />
                              <p className="text-slate-500 font-semibold">Uploading...</p>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary mb-2">cloud_upload</span>
                              <p className="text-slate-900 dark:text-white font-semibold">Upload Identity Document</p>
                              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Drag and drop or click to browse (PNG, JPG up to 2MB)</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={idInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, "ID");
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Business Registration */}
                  <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-8 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-sm">2</div>
                      <h3 className="text-slate-900 dark:text-white font-bold text-lg">Business Registration</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-0 sm:pl-11">
                      <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">CAC Registration Number</label>
                        <input
                          type="text"
                          value={cacNumber}
                          onChange={(e) => setCacNumber(e.target.value)}
                          placeholder="RC-XXXXXX"
                          className="form-input w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary uppercase tracking-widest"
                        />
                      </div>
                    </div>

                    {/* CAC Upload Zone */}
                    <div className="pl-0 sm:pl-11">
                      <div
                        onClick={() => !isUploadingCac && cacInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-xl p-8 transition-all group cursor-pointer ${
                          cacUrl
                            ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center text-center">
                          {cacUrl ? (
                            <>
                              <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">check_circle</span>
                              <p className="text-emerald-600 dark:text-emerald-400 font-semibold">CAC Certificate Uploaded</p>
                              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Click to replace</p>
                            </>
                          ) : isUploadingCac ? (
                            <>
                              <div className="size-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-2" />
                              <p className="text-slate-500 font-semibold">Uploading...</p>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary mb-2">description</span>
                              <p className="text-slate-900 dark:text-white font-semibold">Upload CAC Certificate</p>
                              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Official certificate of incorporation (PDF, PNG, JPG)</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={cacInputRef}
                          className="hidden"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, "CAC");
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={submitting || isUploadingId || isUploadingCac}
                      className="w-full flex items-center justify-center gap-3 bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] rounded-xl h-14 font-bold text-lg hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">shield_person</span>
                          Submit for Verification
                        </>
                      )}
                    </button>
                    <p className="text-center text-slate-500 dark:text-slate-400 text-xs mt-4">
                      Verification usually takes 24–48 business hours.
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Tier Rewards Card */}
            <div className="bg-[#0f172a] rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500">stars</span>
                  Verification Tiers
                </h3>

                <div className="space-y-6">
                  {/* Tier 1: Basic */}
                  <div className="pb-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-emerald-500">Tier 1: Basic</span>
                      {tier >= VerificationTier.UNVERIFIED && (
                        <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">Standard trading limits, access to basic inventory management.</p>
                  </div>

                  {/* Tier 2: Verified */}
                  <div className={`pb-4 border-b border-white/10 ${tier < VerificationTier.VERIFIED ? "opacity-70" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">Tier 2: Verified</span>
                      {tier >= VerificationTier.VERIFIED ? (
                        <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-white/30 text-sm">lock</span>
                      )}
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1">
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">done</span>
                        Increased withdrawal limits
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">done</span>
                        Priority customer support
                      </li>
                    </ul>
                  </div>

                  {/* Tier 3: Trusted Partner */}
                  <div className={tier < VerificationTier.TRUSTED ? "opacity-50" : ""}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">Tier 3: Trusted Partner</span>
                      {tier >= VerificationTier.TRUSTED ? (
                        <span className="material-symbols-outlined text-amber-400 text-sm">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-white/30 text-sm">lock</span>
                      )}
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1">
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">done</span>
                        Unlimited trading volumes
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">done</span>
                        Dedicated account manager
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Background watermark */}
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <span className="material-symbols-outlined text-[200px]">verified</span>
              </div>
            </div>

            {/* Security Notice Card */}
            <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                  <span className="material-symbols-outlined text-primary">security</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-slate-900 dark:text-white font-bold mb-2">Data Security Notice</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Your documents are encrypted and stored securely. We never share your private business data with third parties. Swifta complies with NDPR data protection standards.
                  </p>
                  <a className="text-primary text-xs font-bold mt-4 inline-block hover:underline" href="#">
                    Learn more about our privacy policy
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
