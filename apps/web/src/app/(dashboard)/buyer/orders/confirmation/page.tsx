"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
      <div className="bg-white border border-green-200 rounded-lg shadow-xl p-10 max-w-lg w-full text-center space-y-6 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-green-600" />

        <div className="size-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 relative">
          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20" />
          <span className="material-symbols-outlined text-5xl">
            check_circle
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
            Payment Successful!
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            Your direct purchase has been securely processed and funds are held
            in escrow.
          </p>
        </div>

        {reference && (
          <div className="bg-slate-50 border border-slate-100 p-4 rounded text-xs font-mono font-medium text-slate-600 flex items-center justify-center gap-2">
            <span className="text-slate-400 uppercase tracking-widest font-bold text-[10px]">
              Reference
            </span>
            {reference}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 p-4 rounded text-left flex items-start gap-4">
          <span className="material-symbols-outlined text-blue-600">info</span>
          <div>
            <h4 className="text-sm font-bold text-blue-900 uppercase tracking-widest">
              Next Steps
            </h4>
            <p className="text-xs text-blue-700 mt-1 font-medium leading-relaxed">
              Your order is now being prepared. You will receive a unique{" "}
              <span className="font-extrabold decoration-2 underline">
                delivery OTP code
              </span>{" "}
              once the merchant dispatches your items.
            </p>
          </div>
        </div>

        <div className="pt-6">
          <Link
            href="/buyer/orders"
            className="w-full inline-flex items-center justify-center gap-2 bg-navy-dark hover:bg-navy text-white font-black text-xs uppercase tracking-widest py-4 rounded transition-colors"
          >
            <span className="material-symbols-outlined text-lg">list_alt</span>
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
