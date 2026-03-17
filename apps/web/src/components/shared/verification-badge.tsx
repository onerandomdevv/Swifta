import React from "react";
import { VerificationTier } from "@swifta/shared";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  tier: VerificationTier | string;
  showLabel?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function VerificationBadge({ tier, showLabel = true, size = "md", className }: VerificationBadgeProps) {
  if (tier === "UNVERIFIED" || !tier) return null;

  const config = {
    TIER_1: {
      icon: "verified_user",
      label: "Basic",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50/50 dark:bg-blue-900/20",
      border: "border-blue-100 dark:border-blue-800",
    },
    TIER_2: {
      icon: "verified",
      label: "Identity",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50/50 dark:bg-emerald-900/20",
      border: "border-emerald-100 dark:border-emerald-800",
    },
    TIER_3: {
      icon: "workspace_premium",
      label: "Business",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50/50 dark:bg-amber-900/20",
      border: "border-amber-100 dark:border-amber-800",
    },
  }[tier as string] || {
    icon: "verified",
    label: "Verified",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  };

  const sizeClasses = {
    xs: "gap-0.5 px-1 py-0 text-[8px]",
    sm: "gap-1 px-1.5 py-0.5 text-[9px]",
    md: "gap-1.5 px-2 py-1 text-[10px]",
    lg: "gap-2 px-3 py-1.5 text-xs",
  }[size];

  const iconSize = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  return (
    <div className={cn(
      "inline-flex items-center font-bold uppercase tracking-widest rounded-lg border shadow-sm select-none shrink-0",
      config.bg, 
      config.color,
      config.border,
      sizeClasses,
      className
    )}>
      <span className={cn("material-symbols-outlined font-variation-fill", iconSize)}>
        {config.icon}
      </span>
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}
