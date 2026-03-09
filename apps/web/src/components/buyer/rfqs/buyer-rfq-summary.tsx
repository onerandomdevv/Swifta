import React from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { RFQ } from "@hardware-os/shared";

interface Props {
  rfq: RFQ;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function BuyerRFQSummary({ rfq, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest">
            Request Details
          </h3>
          <StatusBadge status={rfq.status} />
        </div>

        {rfq.status === "OPEN" && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-navy-dark hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Edit RFQ"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="size-8 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Delete RFQ"
              >
                <span className="material-symbols-outlined text-sm">
                  delete
                </span>
              </button>
            )}
          </div>
        )}
      </div>
      <div className="space-y-8">
        {/* Display Item Details */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Item Requested
          </p>
          <p className="text-xl font-black text-navy-dark dark:text-white">
            {rfq.product?.name ||
              rfq.unlistedItemDetails?.name ||
              "Unlisted Item"}
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
              Quantity
            </p>
            <p className="text-2xl font-black text-navy-dark dark:text-white">
              {rfq.quantity.toLocaleString()}{" "}
              {rfq.product?.unit || rfq.unlistedItemDetails?.unit || ""}
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
