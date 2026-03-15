"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { merchantApi } from "@/lib/api/merchant.api";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function VerificationBanner() {
  const { data: status, isLoading } = useQuery({
    queryKey: ["merchant", "verification-status"],
    queryFn: () => merchantApi.getVerificationStatus(),
  });

  if (isLoading || !status) return null;

  const isVerified = status.tier === "VERIFIED" || status.tier === "TRUSTED";
  const hasPending = status.pendingRequest?.status === "PENDING";
  const isRejected = status.pendingRequest?.status === "REJECTED";

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
      description: `Reason: ${status.pendingRequest?.rejectionReason || "Documents were insufficient."}. Please update and resubmit.`,
      actionLabel: "Fix Issues",
      actionHref: "/merchant/verification"
    };
  }

  return (
    <div className={cn(
      "w-full px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 transition-all animate-in slide-in-from-top duration-500",
      bannerConfig.bg,
      bannerConfig.text
    )}>
      <div className="flex items-center gap-3">
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
      <Link
        href={bannerConfig.actionHref}
        className="px-6 py-2 bg-background text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-background-secondary transition-colors shadow-lg shadow-black/10 shrink-0"
      >
        {bannerConfig.actionLabel}
      </Link>
    </div>
  );
}
