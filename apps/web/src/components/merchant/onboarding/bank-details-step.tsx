import React, { useState, useEffect } from "react";
import { OnboardingFormData } from "./types";
import { getNigerianBanks } from "@/lib/api/payment.api";

interface Props {
  formData: OnboardingFormData;
  updateForm: (updates: Partial<OnboardingFormData>) => void;
}

export function BankDetailsStep({ formData, updateForm }: Props) {
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [fetchingBanks, setFetchingBanks] = useState(true);

  useEffect(() => {
    async function loadBanks() {
      try {
        const list = await getNigerianBanks();
        setBanks(list.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error("Failed to fetch banks", err);
      } finally {
        setFetchingBanks(false);
      }
    }
    loadBanks();
  }, []);
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
          Bank Details
        </h3>
        <p className="text-slate-500 font-bold text-sm leading-relaxed">
          Payout account for receiving trade payments. This must match your
          registered business name.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Bank Name / Code
          </label>
          <select
            value={formData.bankCode}
            onChange={(e) => updateForm({ bankCode: e.target.value })}
            disabled={fetchingBanks}
            className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all text-slate-400 appearance-none bg-transparent disabled:opacity-50"
          >
            <option value="">
              {fetchingBanks ? "Loading banks..." : "Select your bank..."}
            </option>
            {banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Account Number
          </label>
          <input
            value={formData.bankAccountNo}
            onChange={(e) =>
              updateForm({
                bankAccountNo: e.target.value.replace(/\D/g, "").slice(0, 10),
              })
            }
            className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white"
            placeholder="0123456789"
            inputMode="numeric"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Account Name
          </label>
          <input
            value={formData.bankAccountName}
            onChange={(e) => updateForm({ bankAccountName: e.target.value })}
            className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white"
            placeholder="LAGOS TOOLS & MACHINERY LTD"
          />
        </div>

        <div className="p-6 bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl flex gap-4">
          <span className="material-symbols-outlined text-amber-500">info</span>
          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide leading-relaxed">
            Account name must match your registered business name for payout
            verification.
          </p>
        </div>
      </div>
    </div>
  );
}
