import React from "react";
import { OnboardingFormData } from "./types";
import { StatusBadge } from "@/components/ui/status-badge";

interface Props {
  formData: OnboardingFormData;
}

export function ReviewStep({ formData }: Props) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-[500px] pr-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
          Review & Finish
        </h3>
        <p className="text-slate-500 font-bold text-sm leading-relaxed">
          Confirm your details before activation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {[
          {
            label: "Business",
            val: formData.businessName || "Not Provided",
            icon: "store",
          },
          { label: "Type", val: formData.businessType, icon: "category" },
          {
            label: "Registration",
            val: formData.cacNumber || "Pending",
            icon: "badge",
          },
          {
            label: "Warehouse",
            val: formData.distributionCenter,
            icon: "location_on",
          },
          {
            label: "Bank",
            val: formData.bankAccountName || "Not Provided",
            icon: "account_balance",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-navy-dark dark:text-white">
                <span className="material-symbols-outlined text-lg">
                  {item.icon}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {item.label}
                </p>
                <p className="text-sm font-black text-navy-dark dark:text-white uppercase mt-0.5">
                  {item.val}
                </p>
              </div>
            </div>
            <StatusBadge status="PENDING" />
          </div>
        ))}
      </div>

      <div className="p-8 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 rounded-[2rem] flex gap-5">
        <span className="material-symbols-outlined text-emerald-500 scale-125">
          info
        </span>
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 leading-relaxed uppercase tracking-wide">
          Upon completion, your profile will enter internal review. You can
          still list products meanwhile.
        </p>
      </div>
    </div>
  );
}
