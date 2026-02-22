import React from "react";
import type { Order } from "@hardware-os/shared";

interface Props {
  order: Order;
}

export function MerchantOrderGuide({ order }: Props) {
  return (
    <>
      {/* Dispatch CTA for PAID orders */}
      {order.status === "PAID" && (
        <div className="bg-gradient-to-br from-navy-dark to-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl">
          <div className="relative z-10 space-y-6">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
              Logistic Action Required
            </p>
            <h3 className="text-2xl font-black uppercase tracking-tight leading-tight max-w-lg">
              Please dispatch materials to the buyer and request their OTP for
              payout release.
            </h3>
          </div>
        </div>
      )}

      {/* Delivery OTP Section - shown to merchant when dispatched */}
      {order.status === "DISPATCHED" && order.deliveryOtp && (
        <div className="bg-navy-dark rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-navy-dark/20">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-4 text-center md:text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
                Delivery Verification
              </p>
              <h3 className="text-2xl font-black uppercase tracking-tight leading-tight max-w-sm">
                Provide this OTP to the rider for the buyer to verify receiving
                the goods.
              </h3>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] text-center min-w-[240px]">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">
                Delivery OTP
              </p>
              <p className="text-5xl font-black tracking-widest">
                {order.deliveryOtp}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
