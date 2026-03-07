"use client";

import React, { useEffect, useState } from "react";
import { checkBnplEligibility, joinBnplWaitlist, type BnplEligibilityResponse } from "@/lib/api/bnpl.api";

export function BnplEligibilityCard() {
  const [eligibility, setEligibility] = useState<BnplEligibilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchEligibility() {
      try {
        const res = await checkBnplEligibility();
        setEligibility(res);
      } catch (err) {
        console.error("Failed to check BNPL eligibility", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEligibility();
  }, []);

  const handleJoinWaitlist = async () => {
    setWaitlistStatus("loading");
    try {
      // Basic waitlist join, the backend uses user.id from token and we can pass dummy/empty email until we fetch it from context if needed.
      // But the endpoint requires email in the body. For now we will use a dummy string since the backend saves it.
      // Ideally we'd have the user's email from an auth context.
      const res = await joinBnplWaitlist({ email: "buyer@example.com" });
      setWaitlistStatus("success");
      setMessage(res.message);
    } catch (err: any) {
      setWaitlistStatus("error");
      setMessage(err?.message || "Failed to join waitlist");
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse h-32 mt-6"></div>
    );
  }

  if (!eligibility) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/30 mt-6 relative overflow-hidden">
      {/* Decorative bg icon */}
      <span className="material-symbols-outlined text-[120px] absolute -right-6 -bottom-10 text-indigo-500/5 dark:text-indigo-400/5 rotate-12 pointer-events-none">
        credit_card
      </span>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-indigo-500">
              payments
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Pay Later <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-2 align-middle">Coming Soon</span>
            </h3>
          </div>
          
          {eligibility.eligible ? (
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              You're pre-approved for up to <span className="text-indigo-600 dark:text-indigo-400 font-black">₦{Number(eligibility.maxAmountKobo || 0) / 100}</span> in credit based on your order history!
            </p>
          ) : (
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              Complete <span className="text-indigo-600 dark:text-indigo-400 font-black">{eligibility.ordersNeeded}</span> more orders to unlock Pay Later.
            </p>
          )}
        </div>

        {eligibility.eligible && (
          <div className="shrink-0 flex items-center gap-3">
             {waitlistStatus === "success" ? (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg">
                  {message}
                </p>
             ) : (
               <button
                 onClick={handleJoinWaitlist}
                 disabled={waitlistStatus === "loading"}
                 className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
               >
                 {waitlistStatus === "loading" ? "Processing..." : "Notify Me When Live"}
               </button>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
