"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@swifta/shared";
import { formatKobo } from "@/lib/utils";

interface DispatchModalProps {
  order: Order;
  onClose: () => void;
}

export function DispatchModal({ order, onClose }: DispatchModalProps) {
  const router = useRouter();
  const otp = order.deliveryOtp || "------";
  const formattedOtp =
    otp.length === 6 ? `${otp.slice(0, 3)} ${otp.slice(3)}` : otp;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(otp).then(() => {
      alert("OTP code copied to clipboard!");
    });
  };

  return (
    <>
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-[520px] bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-700 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-300">
          {/* Success Header */}
          <div className="flex flex-col items-center justify-center p-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="w-16 h-16 bg-green-600 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-white text-4xl font-bold">
                check
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white uppercase">
              Dispatch Successful
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
              Delivery Process Started
            </p>
          </div>

          {/* OTP Display */}
          <div className="p-10 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
              Delivery Confirmation Code
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-900 dark:border-white py-8 px-6 mb-6">
              <span className="text-5xl font-mono font-bold tracking-[0.25em] text-slate-900 dark:text-white">
                {formattedOtp}
              </span>
            </div>
            <div className="px-4">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                Provide this code to your driver. The buyer must enter this code
                upon delivery to trigger your payout.
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mx-10 p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Order ID
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Order Total
              </span>
              <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {formatKobo(
                  Number(order.totalAmountKobo) + Number(order.deliveryFeeKobo),
                )}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-10 space-y-4">
            <button
              onClick={handleCopyCode}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 px-8 text-sm uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-4 shadow-md active:translate-y-0.5"
            >
              <span className="material-symbols-outlined text-xl">
                content_copy
              </span>
              <span>Copy Code</span>
            </button>
            <button
              onClick={() => {
                onClose();
                router.push(`/merchant/orders/${order.id}/dispatch-slip`);
              }}
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-600 dark:text-slate-300 font-bold py-4 px-8 text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined text-xl">print</span>
              <span>Print Shipping Slip</span>
            </button>
          </div>

          {/* Footer */}
          <div className="bg-slate-100 dark:bg-slate-800 p-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[9px] text-center text-slate-400 uppercase tracking-widest font-bold">
              Swifta — Secure E-commerce Platform
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
