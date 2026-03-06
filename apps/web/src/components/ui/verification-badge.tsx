import React from "react";
import { VerificationTier } from "@hardware-os/shared";

interface VerificationBadgeProps {
  tier: VerificationTier | string;
  className?: string;
}

export function VerificationBadge({
  tier,
  className = "",
}: VerificationBadgeProps) {
  if (tier === "UNVERIFIED" || tier === "BASIC") {
    return null; // Don't show badges for lower tiers per spec
  }

  if (tier === "TRUSTED") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 ${className}`}
        title="Trusted Merchant"
      >
        <span className="material-symbols-outlined text-[10px]">stars</span>
        Trusted
      </span>
    );
  }

  if (tier === "VERIFIED") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 ${className}`}
        title="Verified Merchant"
      >
        <span className="material-symbols-outlined text-[10px]">verified</span>
        Verified
      </span>
    );
  }

  return null;
}
