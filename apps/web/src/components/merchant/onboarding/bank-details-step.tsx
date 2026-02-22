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
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
        <div className="space-y-3 relative">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Bank Name / Code
          </label>

          <button
            type="button"
            onClick={() => !fetchingBanks && setIsOpen(!isOpen)}
            disabled={fetchingBanks}
            className="w-full px-8 py-5 text-left text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all text-slate-400 bg-transparent disabled:opacity-50 flex items-center justify-between"
          >
            <span
              className={
                formData.bankCode ? "text-navy-dark dark:text-white" : ""
              }
            >
              {fetchingBanks
                ? "Loading banks..."
                : formData.bankCode
                  ? banks.find((b) => b.code === formData.bankCode)?.name ||
                    "Select your bank..."
                  : "Select your bank..."}
            </span>
            <span className="material-symbols-outlined text-slate-400">
              expand_more
            </span>
          </button>

          {isOpen && (
            <div className="absolute top-100 left-0 right-0 mt-2 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[1.5rem] shadow-xl z-50 overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-400">
                    search
                  </span>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search for a bank..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-sm font-bold border-2 border-transparent bg-white dark:bg-slate-950 rounded-xl focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white"
                  />
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-2">
                {filteredBanks.length === 0 ? (
                  <div className="p-4 text-center text-sm font-bold text-slate-400">
                    No banks found
                  </div>
                ) : (
                  filteredBanks.map((bank) => (
                    <button
                      key={bank.code}
                      type="button"
                      onClick={() => {
                        updateForm({ bankCode: bank.code });
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full text-left px-6 py-4 text-sm font-bold rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${formData.bankCode === bank.code ? "bg-navy-dark text-white hover:bg-navy-dark dark:hover:bg-navy-dark" : "text-slate-600 dark:text-slate-300"}`}
                    >
                      {bank.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
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
