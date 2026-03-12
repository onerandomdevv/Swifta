"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  merchantApi
} from "@/lib/api/merchant.api";
import { useToast } from "@/providers/toast-provider";
import { MerchantProfile, VerificationTier } from "@hardware-os/shared";

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | "NONE";

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
      
      toast.success(`${type} document synced to cloud`);
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
      // 1. If profile info changed, update it
      if (cacNumber && cacNumber !== profile?.cacNumber) {
        await merchantApi.updateProfile({ cacNumber });
      }

      // 2. Submit verification request
      await merchantApi.submitVerificationRequest({
        idType,
        governmentIdUrl: idUrl,
        cacCertUrl: cacUrl || undefined,
      });
      
      toast.success("Verification protocol initialized!");
      setStatus("PENDING");
    } catch (err: any) {
      toast.error(err?.message || "Protocol execution failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 min-h-[60vh] space-y-4">
        <div className="size-16 border-4 border-slate-100 dark:border-slate-800 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Protocol...</p>
      </div>
    );
  }

  const isProfileIncomplete = !profile?.businessName || !profile?.bankAccountNumber;

  const TierBadge = ({ currentTier }: { currentTier: VerificationTier }) => {
    const config: Record<VerificationTier, { label: string, color: string, icon: string, glow: string }> = {
      [VerificationTier.UNVERIFIED]: { label: "Unverified", color: "text-slate-400 bg-slate-100 dark:bg-slate-800", icon: "help", glow: "" },
      [VerificationTier.BASIC]: { label: "Basic", color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20", icon: "check", glow: "shadow-blue-500/10" },
      [VerificationTier.VERIFIED]: { label: "Verified", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20", icon: "verified", glow: "shadow-emerald-500/10" },
      [VerificationTier.TRUSTED]: { label: "Trusted Partner", color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20", icon: "workspace_premium", glow: "shadow-amber-500/20" },
    };

    const item = config[currentTier] || config[VerificationTier.UNVERIFIED];

    return (
      <div className={`flex items-center gap-2 px-5 py-2 rounded-2xl ${item.color} ${item.glow} border border-current font-black text-[10px] uppercase tracking-widest shadow-lg`}>
        <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
        {item.label}
      </div>
    );
  };

  const BenefitItem = ({ title, active }: { title: string, active: boolean }) => (
    <div className={`flex items-center gap-3 text-[11px] font-bold ${active ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 opacity-40'}`}>
      <span className={`material-symbols-outlined text-lg ${active ? 'text-emerald-500' : 'text-slate-300'}`}>
        {active ? 'check_circle' : 'circle'}
      </span>
      {title}
    </div>
  );

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] ml-1">Trust Onboarding</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <h1 className="text-4xl md:text-5xl font-black text-navy-dark dark:text-white tracking-tighter uppercase font-display leading-none">
              Business <br className="sm:hidden" /><span className="text-primary opacity-80">Verification</span>
            </h1>
            <TierBadge currentTier={tier} />
          </div>
          <p className="text-slate-500 font-bold text-sm max-w-lg">Manifest your company&apos;s credibility to unlock higher settlement limits and industrial trade financing.</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-8 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary hover:border-primary/30 transition-all shadow-sm hover:shadow-xl active:scale-95"
        >
          Back to Command Center
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Main flow */}
        <div className="xl:col-span-8 space-y-12">
          {isProfileIncomplete ? (
            <div className="p-10 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-100 dark:border-amber-900/50 rounded-[3rem] space-y-6 animate-in zoom-in-95 duration-500 shadow-2xl shadow-amber-500/5">
              <div className="size-16 bg-amber-100 dark:bg-amber-900/40 rounded-[1.5rem] flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-amber-600 dark:text-amber-400">contact_mail</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Profile Data Missing</h3>
                <p className="text-slate-500 text-sm font-bold leading-relaxed">
                  You must configure your business nomenclature and settlement terminal (Bank Account) before initializing the verification protocol.
                </p>
              </div>
              <button
                onClick={() => router.push("/merchant/settings")}
                className="px-10 py-5 bg-navy-dark dark:bg-white text-white dark:text-navy-dark rounded-[1.25rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-navy-dark/20 hover:scale-105 active:scale-95 transition-all"
              >
                Configure Settings
              </button>
            </div>
          ) : status === "PENDING" ? (
            <div className="p-16 bg-blue-50/30 dark:bg-blue-950/10 border-2 border-dashed border-blue-200 dark:border-blue-900/30 rounded-[3rem] text-center space-y-8 animate-in zoom-in-95 duration-700">
              <div className="size-24 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <span className="material-symbols-outlined text-5xl text-blue-600 dark:text-blue-400">update</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Protocol Under Review</h3>
                <p className="text-slate-500 max-w-sm mx-auto font-bold leading-relaxed">
                  Our intelligence team is validating your manifest documents. Execution typically completes within 24-48 hours.
                </p>
              </div>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                   <div className="size-1.5 bg-blue-500 rounded-full animate-ping" />
                   Reviewing Integrity
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none space-y-12">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-primary/10 text-primary rounded-[1.25rem]">
                  <span className="material-symbols-outlined text-2xl">verified_user</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tighter leading-none">Manifest Requirements</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">Initialize your verification tier upgrade.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-12">
                {/* Section 1: Identity */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-white bg-primary size-5 rounded flex items-center justify-center">1</span>
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">
                      Step 1: Identity Extraction
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                        Government ID Protocol
                      </label>
                      <div className="relative">
                        <select
                          value={idType}
                          onChange={(e) => setIdType(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-navy-dark dark:text-white outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select Protocol</option>
                          <option value="NATIONAL_ID">National ID (NIN)</option>
                          <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
                          <option value="PASSPORT">International Passport</option>
                          <option value="VOTERS_CARD">Voter&apos;s Card</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                        ID Visual Surface
                      </label>
                      <div 
                        onClick={() => !isUploadingId && idInputRef.current?.click()}
                        className={`w-full h-[88px] border-2 border-dashed rounded-2xl flex items-center px-6 gap-4 cursor-pointer transition-all transition-all duration-300 overflow-hidden ${
                          idUrl 
                            ? "border-emerald-400 bg-emerald-50/10" 
                            : "border-slate-200 dark:border-slate-800 hover:border-primary bg-slate-50/50"
                        }`}
                      >
                        {idUrl ? (
                          <>
                            <div className="size-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-emerald-200 shadow-sm">
                              <img src={idUrl} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[10px] font-black text-emerald-600 uppercase truncate">Identity.manifest synced</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-0.5">TAP TO RE-SYNC</p>
                            </div>
                            <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                          </>
                        ) : isUploadingId ? (
                         <div className="flex items-center gap-3">
                            <div className="size-5 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uploading...</p>
                         </div>
                        ) : (
                          <>
                            <div className="size-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100">
                              <span className="material-symbols-outlined text-slate-400">upload_file</span>
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-navy-dark dark:text-white uppercase tracking-widest">Add ID Capture</p>
                               <p className="text-[9px] font-bold text-slate-400 mt-0.5">PNG, JPG (MAX 2MB)</p>
                            </div>
                          </>
                        )}
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
                </div>

                {/* Section 2: Business */}
                <div className="space-y-8 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-white bg-emerald-500 size-5 rounded flex items-center justify-center">2</span>
                      <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em]">
                        Step 2: Corporate Registry (Trusted)
                      </h4>
                    </div>
                    <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-full text-[9px] font-black text-emerald-600 uppercase tracking-widest">Tier 3 Required</div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                        CAC RC Number
                      </label>
                      <input
                        type="text"
                        placeholder="RC-1234567"
                        value={cacNumber}
                        onChange={(e) => setCacNumber(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-navy-dark dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all placeholder:opacity-50 uppercase tracking-widest"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                        CAC Surface Upload
                      </label>
                      <div 
                        onClick={() => !isUploadingCac && cacInputRef.current?.click()}
                        className={`w-full h-[88px] border-2 border-dashed rounded-2xl flex items-center px-6 gap-4 cursor-pointer transition-all duration-300 overflow-hidden ${
                          cacUrl 
                            ? "border-emerald-400 bg-emerald-50/10" 
                            : "border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50/50"
                        }`}
                      >
                        {cacUrl ? (
                          <>
                            <div className="size-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-emerald-200 shadow-sm">
                              <img src={cacUrl} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[10px] font-black text-emerald-600 uppercase truncate">CAC_Registration.manifest synced</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-0.5">TAP TO RE-SYNC</p>
                            </div>
                            <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                          </>
                        ) : isUploadingCac ? (
                         <div className="flex items-center gap-3">
                            <div className="size-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uploading...</p>
                         </div>
                        ) : (
                          <>
                            <div className="size-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100">
                              <span className="material-symbols-outlined text-slate-400">corporate_fare</span>
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-navy-dark dark:text-white uppercase tracking-widest">Connect CAC Cert</p>
                               <p className="text-[9px] font-bold text-slate-400 mt-0.5">UPLOAD REGISTERED DOCUMENT</p>
                            </div>
                          </>
                        )}
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
                </div>

                <div className="pt-8 border-t border-slate-50 dark:border-slate-800/50">
                  <button
                    type="submit"
                    disabled={submitting || isUploadingId || isUploadingCac}
                    className="group relative w-full h-20 bg-navy-dark dark:bg-primary text-white dark:text-navy-dark rounded-[1.5rem] font-black uppercase tracking-[0.4em] text-[11px] transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0 shadow-2xl shadow-navy-dark/30 dark:shadow-primary/10 overflow-hidden"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-4">
                      {submitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                          <span>Executing Protocol</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-xl">shield_person</span>
                          <span>Initialize Verification Protocol</span>
                        </>
                      )}
                    </div>
                    {!submitting && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    )}
                  </button>
                  <p className="text-[9px] text-center text-slate-400 mt-6 font-bold uppercase tracking-[0.1em] opacity-60">
                    By initializing, you authorize document integrity scans and <br /> compliance checks in alignment with industrial trade protocols.
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-4 space-y-10">
          <div className="bg-navy-dark dark:bg-slate-800/80 backdrop-blur-xl rounded-[3rem] p-10 text-white space-y-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <span className="material-symbols-outlined text-[120px]">military_tech</span>
            </div>
            
            <div className="space-y-4 relative z-10">
              <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Manifest<br />Rewards</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Verification unlocks industrial capacity</p>
            </div>

            <div className="space-y-10 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">Tier 1: Basic</p>
                   {tier >= VerificationTier.UNVERIFIED && <span className="text-[10px] font-black text-emerald-400 opacity-80 uppercase">Active</span>}
                </div>
                <div className="space-y-3 bg-white/5 p-5 rounded-[1.5rem] border border-white/5">
                  <BenefitItem title="List up to 5 products" active={tier >= VerificationTier.UNVERIFIED} />
                  <BenefitItem title="₦100k daily settlement limit" active={tier >= VerificationTier.UNVERIFIED} />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em]">Tier 2: Verified</p>
                   {tier >= VerificationTier.VERIFIED && <span className="text-[10px] font-black text-emerald-400 uppercase">Unlocked</span>}
                </div>
                <div className={`space-y-3 p-5 rounded-[1.5rem] border ${tier >= VerificationTier.VERIFIED ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                  <BenefitItem title="Unlimited product catalogs" active={tier >= VerificationTier.VERIFIED} />
                  <BenefitItem title="₦5M industrial daily limit" active={tier >= VerificationTier.VERIFIED} />
                  <BenefitItem title="'Verified' surface badge" active={tier >= VerificationTier.VERIFIED} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.25em]">Tier 3: Trusted Partner</p>
                   {tier === VerificationTier.TRUSTED && <span className="text-[10px] font-black text-amber-400 uppercase">Sovereign</span>}
                </div>
                <div className={`space-y-3 p-5 rounded-[1.5rem] border ${tier === VerificationTier.TRUSTED ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/5'}`}>
                  <BenefitItem title="Unlimited capital settlement" active={tier === VerificationTier.TRUSTED} />
                  <BenefitItem title="Priority logistics protocol" active={tier === VerificationTier.TRUSTED} />
                  <BenefitItem title="Trade financing eligibility" active={tier === VerificationTier.TRUSTED} />
                </div>
              </div>
            </div>

            <div className="pt-6 relative z-10">
               <div className="h-px bg-white/10 w-full mb-8" />
               <div className="flex items-center gap-4 text-emerald-400 group/help cursor-pointer">
                  <div className="size-10 bg-emerald-400/10 rounded-full flex items-center justify-center group-hover/help:scale-110 transition-transform">
                     <span className="material-symbols-outlined text-xl">contact_support</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Protocol Support</p>
                    <p className="text-[9px] font-bold text-slate-400">WhatsApp Expert Response</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
            <h5 className="text-[11px] font-black text-navy-dark dark:text-white uppercase tracking-widest mb-3">Security Intelligence</h5>
            <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
              Industrial documents are processed via end-to-end encrypted tunnels. SwiftTrade never persists raw PII on accessible servers—all data is tokenized and stored in compliance with NDPR protocols.
            </p>
          </div>
        </div>
      </div>
      
      <div className="h-20" />
    </div>
  );
}
