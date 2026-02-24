import React from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { RFQ } from "@hardware-os/shared";

interface Props {
  rfq: RFQ;
}

export function RfqSummary({ rfq }: Props) {
  return (
    <div className="lg:col-span-7 space-y-10">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50 dark:border-slate-800">
          <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
            Request Details
          </h3>
          <StatusBadge status={rfq.status} />
        </div>

        <div className="space-y-8">
          {/* Display Item Details */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Material Requested
            </p>
            <p className="text-xl font-black text-navy-dark dark:text-white">
              {rfq.product?.name || rfq.unlistedItemDetails?.name || "Unlisted Item"}
            </p>
            {rfq.unlistedItemDetails?.description && (
              <p className="text-[11px] font-bold text-slate-500 mt-2">
                {rfq.unlistedItemDetails.description}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Quantity Requested
              </p>
              <p className="text-2xl font-black text-navy-dark dark:text-white">
                {rfq.quantity.toLocaleString()} {rfq.product?.unit || rfq.unlistedItemDetails?.unit || ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Expires
              </p>
              <p className="text-sm font-black text-navy-dark dark:text-white">
                {new Date(rfq.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Delivery Address
            </p>
            <p className="text-sm font-bold text-navy-dark dark:text-white">
              {rfq.deliveryAddress}
            </p>
          </div>
          {rfq.notes && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Buyer Notes
              </p>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {rfq.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10">
        <div className="flex items-center gap-4 mb-4">
          <span className="material-symbols-outlined text-blue-500 font-black">
            info
          </span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
            Quote Expiration Notice
          </p>
        </div>
        <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
          Quotes submitted on Hardware OS are binding for 48 hours. Ensure your
          logistics capacity is verified before finalizing your bid. Settlement
          occurs via escrow upon delivery confirmation.
        </p>
      </div>
    </div>
  );
}
