import React from "react";
import { formatKobo } from "@hardware-os/shared";
import type { Order } from "@hardware-os/shared";

interface Props {
  order: Order;
  paying: boolean;
  onPay: () => void;
  confirming: boolean;
  confirmingOtp: string;
  setConfirmingOtp: (val: string) => void;
  onConfirmDelivery: () => void;
}

export function BuyerOrderActions({
  order,
  paying,
  onPay,
  confirming,
  confirmingOtp,
  setConfirmingOtp,
  onConfirmDelivery,
}: Props) {
  return (
    <>
      {/* Pay Now - only for PENDING_PAYMENT */}
      {order.status === "PENDING_PAYMENT" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
          <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-6">
            Payment Required
          </h3>
          <p className="text-xs font-bold text-slate-500 mb-8">
            Complete payment to process your order.
          </p>
          <button
            onClick={onPay}
            disabled={paying}
            className="w-full py-5 bg-navy-dark text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-80"
          >
            {paying ? (
              <>
                <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Initializing Payment...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">
                  payments
                </span>
                Pay {formatKobo(BigInt(order.totalAmountKobo))}
              </>
            )}
          </button>
        </div>
      )}

      {/* Confirm Delivery - only for DISPATCHED */}
      {order.status === "DISPATCHED" && (
        <div className="bg-background-light dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center">
          {/* Status Card */}
          <div className="w-full flex justify-center mb-6">
            <div className="shrink-0 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded border border-emerald-100 dark:border-emerald-800/30">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-sm">
                lock
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">
                Escrow Active
              </span>
            </div>
          </div>

          <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight mb-2 text-center">
            Enter Dispatch Code
          </h3>
          <p className="text-xs font-semibold text-slate-500 mb-8 text-center max-w-[280px]">
            Ask your driver for the{" "}
            <span className="font-bold text-navy-dark dark:text-white">
              6-digit code
            </span>{" "}
            to confirm receipt. funds will be securely released.
          </p>

          <div className="w-full space-y-8">
            {/* OTP Input - We use a high letter-spacing input to mimic the grid temporarily for native keyboard support */}
            <div className="relative flex justify-center w-full">
              <input
                type="text"
                maxLength={6}
                value={confirmingOtp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setConfirmingOtp(val);
                }}
                placeholder="------"
                className="w-full max-w-[280px] bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl py-6 text-4xl font-black text-navy-dark dark:text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all text-center tracking-[1em] placeholder:tracking-[0.5em] font-mono shadow-inner"
                style={{ fontVariantNumeric: "tabular-nums" }}
              />
            </div>

            <button
              onClick={onConfirmDelivery}
              disabled={confirming || confirmingOtp.length !== 6}
              className="w-full bg-primary text-white font-bold py-5 rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-[0.2em] text-xs hover:bg-primary/90 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {confirming ? (
                <>
                  <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">
                    verified_user
                  </span>
                  Confirm Delivery
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
