"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { merchantApi } from "@/lib/api/merchant.api";
import { VerificationTier } from "@twizrr/shared";
import Link from "next/link";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "twizrr-merchant-verification-banner-dismissed";

export function VerificationBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const { data: status, isLoading } = useQuery({
    queryKey: ["merchant", "verification-status"],
    queryFn: () => merchantApi.getVerificationStatus(),
  });

  // Smart Dismissal Logic
  useEffect(() => {
    if (status) {
      const currentStatusFingerprint = JSON.stringify({
        tier: status.currentTier,
        t2: status.tier2.status,
        t3: status.tier3.status,
        isRejected: status.tier2.pendingRequest?.status === "REJECTED" || status.tier3.pendingRequest?.status === "REJECTED"
      });

      const saved = localStorage.getItem(DISMISS_KEY);
      if (saved) {
        try {
          const { dismissed, fingerprint: savedFingerprint } = JSON.parse(saved);
          // Only stay hidden if explicitly dismissed AND status hasn't changed
          if (dismissed && savedFingerprint === currentStatusFingerprint) {
            setIsVisible(false);
          } else {
            setIsVisible(true);
          }
        } catch (e) {
          setIsVisible(true);
        }
      }
    }
  }, [status]);

  const handleDismiss = () => {
    if (!status) return;
    setIsVisible(false);
    const fingerprint = JSON.stringify({
      tier: status.currentTier,
      t2: status.tier2.status,
      t3: status.tier3.status,
      isRejected: status.tier2.pendingRequest?.status === "REJECTED" || status.tier3.pendingRequest?.status === "REJECTED"
    });
    localStorage.setItem(DISMISS_KEY, JSON.stringify({ dismissed: true, fingerprint }));
  };

  if (isLoading || !status || !isVisible) return null;

  const isVerified = status.currentTier === VerificationTier.TIER_2 || status.currentTier === VerificationTier.TIER_3;
  const hasPending = status.tier2.status === "IN_PROGRESS" || status.tier3.status === "IN_PROGRESS";
  const activeRequest = status.tier2.pendingRequest || status.tier3.pendingRequest;
  const isRejected = activeRequest?.status === "REJECTED";

  // If verified, don't show the banner
  if (isVerified && !isRejected) return null;

  let bannerConfig = {
    bg: "bg-amber-500",
    text: "text-white",
    icon: "warning",
    title: "Account Unverified",
    description: "Please complete your business verification to unlock full platform features.",
    actionLabel: "Verify Now",
    actionHref: "/merchant/verification"
  };

  if (hasPending) {
    bannerConfig = {
      bg: "bg-blue-600",
      text: "text-white",
      icon: "hourglass_empty",
      title: "Verification Pending",
      description: "Our team is currently reviewing your business documents. This typically takes 24-48 hours.",
      actionLabel: "View Status",
      actionHref: "/merchant/verification"
    };
  } else if (isRejected) {
    bannerConfig = {
      bg: "bg-rose-600",
      text: "text-white",
      icon: "error",
      title: "Verification Rejected",
      description: `Reason: ${activeRequest?.rejectionReason || "Documents were insufficient."}. Please update and resubmit.`,
      actionLabel: "Fix Issues",
      actionHref: "/merchant/verification"
    };
  }

  return (
    <div className={cn(
      "w-full px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 transition-all animate-in slide-in-from-top duration-500 relative",
      bannerConfig.bg,
      bannerConfig.text
    )}>
      <div className="flex items-center gap-3 pr-8 md:pr-0">
        <span className="material-symbols-outlined text-xl shrink-0">
          {bannerConfig.icon}
        </span>
        <div className="flex flex-col md:flex-row md:items-center md:gap-2">
          <p className="font-black text-[10px] uppercase tracking-widest leading-none mb-1 md:mb-0">
            {bannerConfig.title}:
          </p>
          <p className="text-sm font-medium opacity-90 leading-tight">
            {bannerConfig.description}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Link
          href={bannerConfig.actionHref}
          className="px-6 py-2 bg-background text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-background-secondary transition-colors shadow-lg shadow-black/10 shrink-0"
        >
          {bannerConfig.actionLabel}
        </Link>
        <button 
          onClick={handleDismiss}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors group"
          title="Dismiss for now"
        >
          <span className="material-symbols-outlined text-lg opacity-60 group-hover:opacity-100 transition-opacity">close</span>
        </button>
      </div>
    </div>
  );
}
