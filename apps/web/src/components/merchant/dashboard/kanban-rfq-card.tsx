import React from "react";
import type { RFQ } from "@hardware-os/shared";

interface Props {
  rfq: RFQ;
  onReview: (rfqId: string) => void;
}

export function KanbanRfqCard({ rfq, onReview }: Props) {
  // Mock data for UI presentation based on the exact Stitch image until proper fields exists on RFQ model.
  const tagColor =
    rfq.status === "OPEN"
      ? "bg-slate-100 dark:bg-slate-800 text-slate-500"
      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 italic";
  const tagText = rfq.status === "OPEN" ? "NORMAL" : "URGENT";

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-primary transition-colors flex flex-col group cursor-pointer"
      onClick={() => onReview(rfq.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-mono text-slate-400">
          #HW-{rfq.id.slice(0, 4).toUpperCase()}
        </span>
        <span
          className={`text-[10px] px-1.5 py-0.5 font-bold rounded ${tagColor} uppercase tracking-tighter`}
        >
          {tagText}
        </span>
      </div>

      <h4
        className="text-sm font-bold mb-1 truncate text-slate-900 dark:text-white"
        title={rfq.product.name}
      >
        {rfq.quantity} {rfq.product.unit} of {rfq.product.name}
      </h4>

      <p className="text-xs text-slate-500 mb-4 truncate" title={rfq.buyerId}>
        Buyer ID: {rfq.buyerId.split("-")[0].toUpperCase()}
      </p>

      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
        <div className="flex -space-x-2">
          <div
            className="size-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200"
            title="Assigned Agent"
          ></div>
        </div>
        <button
          className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onReview(rfq.id);
          }}
        >
          Review Request
        </button>
      </div>
    </div>
  );
}
