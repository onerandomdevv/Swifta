import React from "react";
import { OnboardingFormData } from "./types";

interface Props {
  formData: OnboardingFormData;
  updateForm: (updates: Partial<OnboardingFormData>) => void;
}

export function KycStep({ formData, updateForm }: Props) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
          Identity & KYC
        </h3>
        <p className="text-slate-500 font-bold text-sm leading-relaxed">
          Official business registration details for trust verification.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            CAC Registration Number
          </label>
          <input
            value={formData.cacNumber}
            onChange={(e) => updateForm({ cacNumber: e.target.value })}
            className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white"
            placeholder="RC-1234567"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Tax Identification Number (TIN)
          </label>
          <input
            value={formData.taxId}
            onChange={(e) => updateForm({ taxId: e.target.value })}
            className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white"
            placeholder="23145678-0001"
          />
        </div>

        <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] bg-slate-50/50 dark:bg-slate-950/50 group hover:border-navy-dark transition-all cursor-pointer">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="size-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-3xl text-slate-300 group-hover:text-navy-dark transition-colors">
                upload_file
              </span>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-navy-dark dark:text-white">
                Upload CAC Document
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                PDF, JPG or PNG (MAX. 5MB)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
