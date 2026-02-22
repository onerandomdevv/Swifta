import React from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { RFQ } from "@hardware-os/shared";

interface Props {
  rfq: RFQ;
}

export function BuyerRFQSummary({ rfq }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50 dark:border-slate-800">
        <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
          Request Details
        </h3>
        <StatusBadge status={rfq.status} />
      </div>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Quantity
            </p>
            <p className="text-2xl font-black text-navy-dark dark:text-white">
              {rfq.quantity.toLocaleString()}
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
              Notes
            </p>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              {rfq.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
