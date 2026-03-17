"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { merchantApi } from "@/lib/api/merchant.api";
import { toast } from "sonner";
import { MerchantProfile, VerificationTier, VerificationIdType } from "@swifta/shared";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { cn, formatKobo } from "@/lib/utils";

type TierStatus = "COMPLETE" | "IN_PROGRESS" | "LOCKED";

interface RequirementStatus {
  label: string;
  met: boolean;
  value?: string | number;
}

export default function MerchantVerificationPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTier, setActiveTier] = useState<1 | 2 | 3>(1);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  
  // Tier 2 Form
  const [ninNumber, setNinNumber] = useState("");
  const [idType, setIdType] = useState<string>(VerificationIdType.NIN);
  const [idUrl, setIdUrl] = useState("");

  // Tier 3 Form
  const [cacNumber, setCacNumber] = useState("");
  const [cacUrl, setCacUrl] = useState("");
  const [addressUrl, setAddressUrl] = useState("");

  const idInputRef = useRef<HTMLInputElement>(null);
  const cacInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = async () => {
    try {
      const [p, s] = await Promise.all([
        merchantApi.getProfile(),
        merchantApi.getVerificationStatus()
      ]);
      setProfile(p);
      setStatus(s);
      
      // Auto-set active tier based on status
      if (s.currentTier === VerificationTier.TIER_3) setActiveTier(3);
      else if (s.currentTier === VerificationTier.TIER_2) setActiveTier(3);
      else if (s.currentTier === VerificationTier.TIER_1) setActiveTier(2);
      else setActiveTier(1);

      // Pre-fill forms if pending requests exist
      if (s.tier2.pendingRequest) {
        setNinNumber(s.tier2.pendingRequest.ninNumber || "");
        setIdType(s.tier2.pendingRequest.idType || VerificationIdType.NIN);
        setIdUrl(s.tier2.pendingRequest.governmentIdUrl || "");
      }
      if (s.tier3.pendingRequest) {
        setCacNumber(p.cacNumber || "");
        setCacUrl(s.tier3.pendingRequest.cacCertUrl || "");
        setAddressUrl(s.tier3.pendingRequest.proofOfAddressUrl || "");
      }
    } catch (err: any) {
      toast.error("Failed to load verification status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileUpload = async (file: File, field: string) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("File exceeds 5MB limit");
    setUploading(field);
    try {
      const { url } = await merchantApi.uploadDocument(file);
      if (field === "id") setIdUrl(url);
      if (field === "cac") setCacUrl(url);
      if (field === "address") setAddressUrl(url);
      toast.success("Document uploaded");
    } catch (err: any) {
      toast.error("Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleTier2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ninNumber || !idUrl) return toast.error("Please provide NIN and ID document");
    
    setSubmitting(true);
    try {
      await merchantApi.submitVerificationRequest({
        targetTier: "TIER_2",
        idType,
        governmentIdUrl: idUrl,
        ninNumber
      });
      toast.success("Tier 2 request submitted!");
      fetchStatus();
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(true); // Keep button disabled while redirecting or refreshing? No, set to false
      setSubmitting(false);
    }
  };

  const handleTier3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cacUrl || !addressUrl) return toast.error("Please provide CAC and Proof of Address");
    
    setSubmitting(true);
    try {
      if (cacNumber && cacNumber !== profile?.cacNumber) {
        await merchantApi.updateProfile({ cacNumber });
      }
      await merchantApi.submitVerificationRequest({
        targetTier: "TIER_3",
        cacCertUrl: cacUrl,
        proofOfAddressUrl: addressUrl
      });
      toast.success("Tier 3 request submitted!");
      fetchStatus();
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !status) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      <p className="text-sm font-bold text-foreground-muted uppercase tracking-widest">Loading Verification status...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <Link href="/merchant/dashboard" className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:underline">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Dashboard
          </Link>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Trust & <span className="text-primary">Verification</span>
          </h1>
          <p className="text-foreground-muted text-sm md:text-base max-w-xl">
            Upgrade your business tier to unlock higher limits, lower fees, and premium trust badges.
          </p>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest mb-1">Current Tier</span>
            <VerificationBadge tier={status.currentTier} size="lg" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Progress Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm sticky top-24">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground-muted mb-8">Verification Journey</h3>
            
            <div className="space-y-2">
              <TierNavButton 
                tier={1} 
                active={activeTier === 1} 
                status={status.tier1.status} 
                onClick={() => setActiveTier(1)}
                label="Level 1: Basic" 
                desc="Daily Limit: ₦50k"
              />
              <TierNavButton 
                tier={2} 
                active={activeTier === 2} 
                status={status.tier2.status} 
                onClick={() => setActiveTier(2)}
                label="Level 2: Identity" 
                desc="Daily Limit: ₦500k"
              />
              <TierNavButton 
                tier={3} 
                active={activeTier === 3} 
                status={status.tier3.status} 
                onClick={() => setActiveTier(3)}
                label="Level 3: Business" 
                desc="Daily Limit: Unlimited"
              />
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <h4 className="text-xs font-bold text-foreground uppercase mb-4">Tier Benefits</h4>
              <ul className="space-y-3">
                <BenefitItem label="Direct Payouts" tier={2} current={status.currentTier} />
                <BenefitItem label="Identity Badge" tier={2} current={status.currentTier} />
                <BenefitItem label="Lowest Platform Fees (1%)" tier={3} current={status.currentTier} />
                <BenefitItem label="Business Trusted Badge" tier={3} current={status.currentTier} />
                <BenefitItem label="Priority Bulk Logistics" tier={3} current={status.currentTier} />
              </ul>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8">
          {activeTier === 1 && (
            <TierDetailView 
              title="Level 1: Basic Verification"
              description="Standard account features for casual trading. Automatically activated once core profile details are met."
              footer={
                status.tier1.status === "COMPLETE" ? (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 border border-emerald-100 dark:border-emerald-800">
                    <span className="material-symbols-outlined font-variation-fill">check_circle</span>
                    <span className="text-sm font-bold">You have completed all Level 1 requirements.</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => router.push("/merchant/settings")}
                    className="w-full h-12 bg-foreground text-background rounded-xl font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                  >
                    Complete Profile Settings
                  </button>
                )
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatusItem label="Email Address" met={status.tier1.requirements.emailVerified} />
                <StatusItem label="Phone Number" met={status.tier1.requirements.phoneVerified} />
                <StatusItem label="Bank Account" met={status.tier1.requirements.bankVerified} />
                <StatusItem label="Business Address" met={status.tier1.requirements.businessAddress} />
                <StatusItem label="Full Legal Name" met={status.tier1.requirements.basicInfo} />
              </div>
            </TierDetailView>
          )}

          {activeTier === 2 && (
            <TierDetailView
              title="Level 2: Identity Verification"
              description="Unlock direct payments and higher daily volumes. Requires manual review of government identification."
              status={status.tier2.status}
              pendingRequest={status.tier2.pendingRequest}
              footer={
                status.tier2.status === "COMPLETE" ? null : 
                status.tier2.status === "LOCKED" ? (
                  <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl flex items-center gap-3 border border-amber-100 dark:border-amber-800">
                    <span className="material-symbols-outlined">lock</span>
                    <span className="text-sm font-bold">Complete Level 1 requirements first to unlock this tier.</span>
                  </div>
                ) : status.tier2.pendingRequest ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-6 rounded-xl space-y-4 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined animate-pulse">history_edu</span>
                      <h4 className="font-bold">Submission under review</h4>
                    </div>
                    <p className="text-xs leading-relaxed opacity-80">
                      Your identity documents are being verified by our compliance team. This typically takes 24 business hours.
                    </p>
                    {status.tier2.pendingRequest.rejectionReason && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium border border-red-100 dark:border-red-900">
                        <span className="font-bold">Last Rejection Reason:</span> {status.tier2.pendingRequest.rejectionReason}
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleTier2Submit} className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">ID Type</label>
                        <select 
                          value={idType} 
                          onChange={e => setIdType(e.target.value)}
                          className="w-full h-12 bg-background-secondary border border-border rounded-xl px-4 text-sm font-bold focus:ring-2 ring-primary/20 outline-none"
                        >
                          <option value={VerificationIdType.NIN}>National ID (NIN)</option>
                          <option value={VerificationIdType.VOTERS_CARD}>Voter's Card</option>
                          <option value={VerificationIdType.PASSPORT}>International Passport</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">NIN Number</label>
                        <input 
                          type="text" 
                          value={ninNumber}
                          onChange={e => setNinNumber(e.target.value)}
                          placeholder="11-digit NIN"
                          className="w-full h-12 bg-background-secondary border border-border rounded-xl px-4 text-sm font-bold focus:ring-2 ring-primary/20 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">Upload Document</label>
                      <div 
                        onClick={() => !uploading && idInputRef.current?.click()}
                        className={cn(
                          "h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                          idUrl ? "border-emerald-500 bg-emerald-500/5" : "border-border hover:border-primary hover:bg-primary/5"
                        )}
                      >
                        {uploading === "id" ? (
                          <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                        ) : idUrl ? (
                          <>
                            <span className="material-symbols-outlined text-emerald-500 font-variation-fill">check_circle</span>
                            <span className="text-xs font-bold text-emerald-600">ID Uploaded Successfully</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-foreground-muted opacity-30 text-3xl">upload_file</span>
                            <span className="text-xs font-bold text-foreground-muted">Click to upload JPG, PNG or PDF (Max 5MB)</span>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={idInputRef} 
                        className="hidden" 
                        onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "id")} 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={submitting || !idUrl || !ninNumber}
                      className="w-full h-14 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:scale-100"
                    >
                      {submitting ? "Submitting..." : "Submit Identity and NIN"}
                    </button>
                  </form>
                )
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatusItem label="Account Identity (ID/NIN)" met={status.tier2.requirements.ninVerified} />
                <StatusItem 
                  label="Completed Orders" 
                  met={status.tier2.requirements.completedOrders.current >= status.tier2.requirements.completedOrders.required} 
                  value={`${status.tier2.requirements.completedOrders.current}/${status.tier2.requirements.completedOrders.required}`}
                />
                <StatusItem label="Dispute-Free History" met={status.tier2.requirements.zeroDisputes} />
                <StatusItem label="Profile Photo Set" met={status.tier2.requirements.profilePhoto} />
              </div>
            </TierDetailView>
          )}

          {activeTier === 3 && (
            <TierDetailView
              title="Level 3: Business Verification"
              description="Our highest tier for established wholesalers. Enjoy 1% platform fees and the premium 'Business Trusted' badge."
              status={status.tier3.status}
              pendingRequest={status.tier3.pendingRequest}
              footer={
                status.tier3.status === "COMPLETE" ? null : 
                status.tier3.status === "LOCKED" ? (
                  <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl flex items-center gap-3 border border-amber-100 dark:border-emerald-800/20">
                    <span className="material-symbols-outlined">lock</span>
                    <span className="text-sm font-bold">You need to reach Level 2 before applying for Business Verification.</span>
                  </div>
                ) : status.tier3.pendingRequest ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-6 rounded-xl space-y-4 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined animate-pulse">verified_user</span>
                      <h4 className="font-bold">Business evaluation in progress</h4>
                    </div>
                    <p className="text-xs leading-relaxed opacity-80">
                      We are reviewing your CAC documentation and warehouse address. This elite verification level usually takes 48-72 business hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleTier3Submit} className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">CAC Number (RC/BN)</label>
                        <input 
                          type="text" 
                          value={cacNumber}
                          onChange={e => setCacNumber(e.target.value)}
                          placeholder="e.g. RC 1234567"
                          className="w-full h-12 bg-background-secondary border border-border rounded-xl px-4 text-sm font-bold focus:ring-2 ring-primary/20 outline-none uppercase"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">CAC Certificate</label>
                          <div 
                            onClick={() => !uploading && cacInputRef.current?.click()}
                            className={cn(
                              "h-24 border border-dashed rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all",
                              cacUrl ? "border-emerald-500 bg-emerald-500/5" : "border-border hover:border-primary"
                            )}
                          >
                            {uploading === "cac" ? <span className="material-symbols-outlined animate-spin text-xs">sync</span> :
                             cacUrl ? <span className="text-[10px] font-bold text-emerald-600">CERTIFICATE UPLOADED</span> :
                             <span className="text-[10px] font-bold text-foreground-muted opacity-40">SELECT FILE</span>}
                          </div>
                          <input type="file" ref={cacInputRef} className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "cac")} />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">Proof of Address</label>
                          <div 
                            onClick={() => !uploading && addressInputRef.current?.click()}
                            className={cn(
                              "h-24 border border-dashed rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all",
                              addressUrl ? "border-emerald-500 bg-emerald-500/5" : "border-border hover:border-primary"
                            )}
                          >
                            {uploading === "address" ? <span className="material-symbols-outlined animate-spin text-xs">sync</span> :
                             addressUrl ? <span className="text-[10px] font-bold text-emerald-600">ADDRESS PROOF UPLOADED</span> :
                             <span className="text-[10px] font-bold text-foreground-muted opacity-40">SELECT FILE</span>}
                          </div>
                          <input type="file" ref={addressInputRef} className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "address")} />
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={submitting || !cacUrl || !addressUrl}
                      className="w-full h-14 bg-foreground text-background rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:scale-100"
                    >
                      {submitting ? "Submitting..." : "Apply for Business Verification"}
                    </button>
                  </form>
                )
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatusItem label="CAC Verification" met={status.tier3.requirements.cacVerified} />
                <StatusItem label="Physical Address Verified" met={status.tier3.requirements.addressVerified} />
                <StatusItem 
                  label="Completed Orders" 
                  met={status.tier3.requirements.completedOrders.current >= status.tier3.requirements.completedOrders.required} 
                  value={`${status.tier3.requirements.completedOrders.current}/${status.tier3.requirements.completedOrders.required}`}
                />
                <StatusItem 
                  label="Minimum Rating" 
                  met={(status.tier3.requirements.averageRating.current || 0) >= status.tier3.requirements.averageRating.required} 
                  value={`${status.tier3.requirements.averageRating.current || 0}/${status.tier3.requirements.averageRating.required}`}
                />
                <StatusItem 
                  label="Account Maturity" 
                  met={status.tier3.status === "COMPLETE" || status.tier3.requirements.accountAge.current.includes("month")} 
                  value={status.tier3.requirements.accountAge.current}
                />
              </div>
            </TierDetailView>
          )}
        </div>
      </div>

      {/* Security Footer */}
      <div className="mt-20 p-8 border-2 border-dashed border-border rounded-3xl flex flex-col md:flex-row items-center gap-8 bg-surface/50">
        <div className="size-20 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-4xl text-primary font-variation-fill">shield_person</span>
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h4 className="font-black text-lg uppercase tracking-tight">Your data is secure</h4>
          <p className="text-sm text-foreground-muted max-w-2xl leading-relaxed">
            Swifta is PCI-DSS and NDPR compliant. Identity documents are encrypted and only accessible to verified senior compliance officers. We never share your business data with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}

function TierNavButton({ tier, label, desc, active, status, onClick }: { tier: number, label: string, desc: string, active: boolean, status: TierStatus, onClick: () => void }) {
  const iconMap: Record<TierStatus, string> = {
    COMPLETE: "check_circle",
    IN_PROGRESS: "radio_button_checked",
    LOCKED: "lock"
  };

  const colorMap: Record<TierStatus, string> = {
    COMPLETE: "text-emerald-500",
    IN_PROGRESS: "text-primary",
    LOCKED: "text-foreground-muted/40"
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4",
        active 
          ? "border-primary bg-primary/5 shadow-sm" 
          : "border-transparent hover:bg-background-secondary"
      )}
    >
      <span className={cn("material-symbols-outlined text-xl font-variation-fill", colorMap[status])}>
        {iconMap[status]}
      </span>
      <div className="flex flex-col">
        <span className={cn("text-sm font-black uppercase tracking-tight", active ? "text-primary" : "text-foreground")}>
          {label}
        </span>
        <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">{desc}</span>
      </div>
    </button>
  );
}

function StatusItem({ label, met, value }: RequirementStatus) {
  return (
    <div className={cn(
      "p-3 rounded-xl border flex items-center justify-between",
      met ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30" : "bg-background-secondary border-border"
    )}>
      <div className="flex items-center gap-2 overflow-hidden">
        <span className={cn(
          "material-symbols-outlined text-sm font-variation-fill shrink-0",
          met ? "text-emerald-500" : "text-foreground-muted/30"
        )}>
          {met ? "check_circle" : "radio_button_unchecked"}
        </span>
        <div className="flex flex-col min-w-0">
          <span className={cn("text-[10px] font-bold uppercase tracking-tight truncate", met ? "text-emerald-700 dark:text-emerald-400" : "text-foreground-muted")}>
            {label}
          </span>
          {value && <span className="text-[9px] font-black text-foreground-muted/60">{value}</span>}
        </div>
      </div>
    </div>
  );
}

function BenefitItem({ label, tier, current }: { label: string, tier: 2 | 3, current: string }) {
  const isUnlocked = current === `TIER_${tier}` || (tier === 2 && current === "TIER_3");
  return (
    <li className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest", isUnlocked ? "text-emerald-600 dark:text-emerald-400" : "text-foreground-muted/40")}>
      <span className="material-symbols-outlined text-sm font-variation-fill">verified</span>
      {label}
    </li>
  );
}

function TierDetailView({ title, description, children, footer, status, pendingRequest }: { title: string, description: string, children: React.ReactNode, footer: React.ReactNode, status?: TierStatus, pendingRequest?: any }) {
  const isLocked = status === "LOCKED";

  return (
    <div className="bg-surface rounded-3xl border border-border p-8 shadow-sm space-y-8 animate-in fade-in duration-500 relative overflow-hidden">
      {isLocked && (
        <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="size-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-700 mb-4 shadow-sm">
            <span className="material-symbols-outlined text-3xl text-slate-400 font-variation-fill">lock</span>
          </div>
          <h4 className="text-lg font-black uppercase tracking-tight text-foreground dark:text-white mb-2">Requirement Locked</h4>
          <p className="text-sm text-foreground-muted max-w-xs mx-auto font-medium">
            You must complete the previous level fully before these requirements and benefits become available.
          </p>
        </div>
      )}
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-foreground">{title}</h2>
        <p className="text-sm text-foreground-muted leading-relaxed">{description}</p>
      </div>
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">Requirements Status</h4>
        {children}
      </div>
      {footer && (
        <div className="pt-8 border-t border-border">
          {footer}
        </div>
      )}
    </div>
  );
}
