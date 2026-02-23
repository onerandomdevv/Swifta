"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPayment } from "@/lib/api/payment.api";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setError("No transaction reference found.");
      setIsVerifying(false);
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        await verifyPayment(reference as string);
        if (isMounted) {
          setIsVerifying(false);
          // Redirect to orders a few seconds after success
          setTimeout(() => {
            router.push("/buyer/orders");
          }, 2000);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Failed to verify transaction.");
          setIsVerifying(false);
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [reference, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-12 shadow-xl shadow-navy-dark/5 text-center max-w-md w-full space-y-6 flex flex-col items-center">
        
        {isVerifying ? (
          <>
            <div className="size-24 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-primary animate-spin mb-6 flex items-center justify-center mx-auto" />
            <h1 className="text-3xl font-black text-navy-dark dark:text-white uppercase tracking-tight font-display">
              Verifying Payment
            </h1>
            <p className="text-sm font-bold text-slate-500">
              Please wait while we confirm your transaction securely...
            </p>
          </>
        ) : error ? (
          <>
            <div className="size-24 rounded-full bg-red-50 dark:bg-red-900/20 border-8 border-red-100 dark:border-red-900/30 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-red-500">
                error
              </span>
            </div>
            <h1 className="text-3xl font-black text-navy-dark dark:text-white uppercase tracking-tight font-display">
              Verification Failed
            </h1>
            <p className="text-sm font-bold text-red-500">
              {error}
            </p>
          </>
        ) : (
          <>
            <div className="size-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border-8 border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-emerald-500">
                check_circle
              </span>
            </div>
            <h1 className="text-3xl font-black text-navy-dark dark:text-white uppercase tracking-tight font-display">
              Payment Confirmed
            </h1>
            <p className="text-sm font-bold text-slate-500">
              Your order status has been successfully updated!
            </p>
          </>
        )}

        {reference && (
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 w-full">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Transaction Reference
            </p>
            <p className="text-xs font-mono font-bold text-navy-dark dark:text-white">
              {reference}
            </p>
          </div>
        )}

        <div className="pt-8 flex flex-col items-center gap-4 w-full">
          {!error && !isVerifying && (
            <div className="flex items-center justify-center gap-3 text-primary text-xs font-black uppercase tracking-widest text-center w-full">
              <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Redirecting to orders...
            </div>
          )}
          
          <button
            onClick={() => router.push("/buyer/orders")}
            className="text-[10px] font-bold text-slate-400 hover:text-navy-dark dark:hover:text-white transition-colors uppercase tracking-widest px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-xl w-full"
          >
            {error ? "Return to Orders" : "Click here to return now"}
          </button>
        </div>
      </div>
    </div>
  );
}
