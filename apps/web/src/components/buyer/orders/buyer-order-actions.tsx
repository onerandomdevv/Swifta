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
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
          <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-6">
            Confirm Delivery
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              value={confirmingOtp}
              onChange={(e) => setConfirmingOtp(e.target.value)}
              placeholder="Enter delivery OTP"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 px-6 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark transition-all text-center tracking-widest"
            />
            <button
              onClick={onConfirmDelivery}
              disabled={confirming || !confirmingOtp}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {confirming ? "Confirming..." : "Confirm Receipt"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
