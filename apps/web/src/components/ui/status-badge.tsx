"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type StatusType =
  | "PENDING_PAYMENT"
  | "PAID"
  | "DISPATCHED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTE"
  | "OPEN"
  | "PENDING"
  | "ACCEPTED"
  | "SUCCESS"
  | "DECLINED"
  | "FAILED"
  | "EXPIRED";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  PENDING_PAYMENT:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  PAID: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  DISPATCHED:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  DELIVERED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  COMPLETED:
    "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
  CANCELLED:
    "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  DISPUTE:
    "bg-rose-200 text-rose-900 dark:bg-rose-900/50 dark:text-rose-300 border-rose-300 dark:border-rose-700",
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  PENDING:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  ACCEPTED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  SUCCESS:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  DECLINED:
    "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  FAILED:
    "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  EXPIRED:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  UNVERIFIED:
    "bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800",
  VERIFIED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase().replace(/\s+/g, "_");
  const style = statusStyles[normalizedStatus] || statusStyles["EXPIRED"];

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
        style,
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
