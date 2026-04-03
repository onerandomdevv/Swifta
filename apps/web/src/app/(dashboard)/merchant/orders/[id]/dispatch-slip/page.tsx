"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrder } from "@/lib/api/order.api";
import { Order, getDisplayName } from "@twizrr/shared";

function formatNaira(kobo: number | bigint): string {
  const naira = Number(kobo) / 100;
  return `₦${naira.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DispatchSlipPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getOrder(id as string)
      .then((data) => setOrder(data as any as Order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <span className="material-symbols-outlined text-5xl text-red-400">
          error
        </span>
        <p className="text-sm font-bold text-red-500">Order not found</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest"
        >
          Go Back
        </button>
      </div>
    );
  }

  const otp = order.deliveryOtp || "------";
  const otpDigits = otp.split("");
  const orderRef = `ORD-${order.id.slice(0, 6).toUpperCase()}`;
  const issueDate = new Date(order.createdAt).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const issueTime = new Date(order.createdAt).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <>
      {/* Action Bar (hidden on print) */}
      <div className="no-print flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-slate-900 dark:text-slate-100 text-base font-bold leading-tight flex-1 px-2 uppercase tracking-tight">
          Dispatch Slip
        </h2>
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center rounded-full bg-primary text-white p-2"
        >
          <span className="material-symbols-outlined">print</span>
        </button>
      </div>

      {/* Printable Area */}
      <div className="max-w-[480px] mx-auto p-4 bg-white min-h-screen text-black print:p-0">
        {/* Header Section */}
        <div className="border-2 border-black p-4 mb-4">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-bold tracking-tighter text-center uppercase">
              twizrr - Dispatch Slip
            </h1>
            {/* Barcode Placeholder */}
            <div
              className="w-full h-12 border-x border-black"
              style={{
                background:
                  "repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px)",
              }}
            />
            <p className="text-lg font-black tracking-widest uppercase">
              {orderRef}
            </p>
            <p className="text-[10px] uppercase font-bold">
              Issued: {issueDate} | {issueTime}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 border-t-2 border-l-2 border-black mb-4">
          <div className="border-b-2 border-r-2 border-black p-3">
            <p className="text-[10px] uppercase font-bold text-slate-600 mb-1">
              Merchant Details
            </p>
            <p className="text-xs font-bold uppercase leading-tight">
              {order.merchant?.businessName || "Merchant"}
            </p>
            <p className="text-[10px] leading-tight">
              {order.merchant?.businessAddress || "Lagos, Nigeria"}
            </p>
          </div>
          <div className="border-b-2 border-r-2 border-black p-3">
            <p className="text-[10px] uppercase font-bold text-slate-600 mb-1">
              Buyer Details
            </p>
            <p className="text-xs font-bold uppercase leading-tight">
              {getDisplayName((order as any).user || (order as any).buyer) || "Buyer"}
            </p>
            <p className="text-[10px] leading-tight">
              {order.deliveryAddress || (order as any).metadata?.deliveryAddress || "Lagos, Nigeria"}
            </p>
          </div>
        </div>

        {/* Item Manifest Table */}
        <div className="border-2 border-black mb-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 border-b-2 border-black bg-slate-100 font-bold text-[10px] uppercase">
            <div className="col-span-8 p-2 border-r-2 border-black">
              Item Description
            </div>
            <div className="col-span-2 p-2 border-r-2 border-black text-center">
              LD
            </div>
            <div className="col-span-2 p-2 text-center">RC</div>
          </div>

          {/* Order Item Row */}
          <div className="grid grid-cols-12 border-b border-black text-xs">
            <div className="col-span-8 p-2 border-r-2 border-black font-medium">
              Order {orderRef} — {formatNaira(order.totalAmountKobo)}
            </div>
            <div className="col-span-2 p-2 border-r-2 border-black flex items-center justify-center">
              <div className="size-4 border-2 border-black"></div>
            </div>
            <div className="col-span-2 p-2 flex items-center justify-center">
              <div className="size-4 border-2 border-black"></div>
            </div>
          </div>

          {/* End of manifest */}
          <div className="grid grid-cols-12 text-xs h-10 italic text-slate-400">
            <div className="col-span-8 p-2 border-r-2 border-black">
              End of manifest
            </div>
            <div className="col-span-2 p-2 border-r-2 border-black"></div>
            <div className="col-span-2 p-2"></div>
          </div>
        </div>

        {/* OTP Verification Section */}
        <div className="border-2 border-black p-4 mb-4 text-center">
          <p className="text-[10px] uppercase font-bold mb-2">
            Driver Verification OTP
          </p>
          <div className="flex justify-center gap-2">
            {otpDigits.map((digit, idx) => (
              <div
                key={idx}
                className="size-10 border-2 border-black flex items-center justify-center text-xl font-black"
              >
                {digit}
              </div>
            ))}
          </div>
          <p className="text-[9px] mt-2 uppercase text-slate-500 italic">
            Do not share this code until goods are received
          </p>
        </div>

        {/* Signature Section */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="flex flex-col gap-8">
            <div className="border-b-2 border-black w-full"></div>
            <p className="text-[10px] font-bold uppercase text-center">
              Dispatch Officer Signature
            </p>
          </div>
          <div className="flex flex-col gap-8">
            <div className="border-b-2 border-black w-full"></div>
            <p className="text-[10px] font-bold uppercase text-center">
              Receiving Party Signature
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[8px] uppercase tracking-widest font-bold">
            Generated by twizrr Logistics Engine
          </p>
          <p className="text-[8px] uppercase font-medium">
            Order Reference: {orderRef}
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
          }
        }
      `}</style>
    </>
  );
}
