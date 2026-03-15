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
      ? "bg-background-secondary text-foreground-muted"
      : "bg-red-500/10 text-red-600 dark:text-red-400 italic";
  const tagText = rfq.status === "OPEN" ? "NORMAL" : "URGENT";

  return (
    <div
      className="bg-surface border border-border p-4 rounded-xl shadow-sm hover:border-primary/50 transition-all flex flex-col group cursor-pointer active:scale-[0.98]"
      onClick={() => onReview(rfq.id)}
    >
      <div className="flex justify-between items-start mb-2.5">
        <span className="text-[10px] font-mono text-foreground-muted/60 font-bold">
          #HW-{rfq.id.slice(0, 4).toUpperCase()}
        </span>
        <span
          className={`text-[9px] px-2 py-0.5 font-black rounded-lg ${tagColor} uppercase tracking-wider`}
        >
          {tagText}
        </span>
      </div>

      <h4
        className="text-sm font-black mb-1 text-foreground leading-tight"
        title={rfq.product.name}
      >
        {rfq.quantity} {rfq.product.unit} of {rfq.product.name}
      </h4>

      <p className="text-[11px] text-foreground-secondary mb-4 font-medium flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">person</span>
        Buyer: {rfq.buyerId.split("-")[0].toUpperCase()}
      </p>

      <div className="flex items-center justify-between border-t border-border-light pt-3 mt-auto">
        <div className="flex -space-x-1.5">
          {[1].map((i) => (
            <div
              key={i}
              className="size-6 rounded-full border-2 border-surface bg-background-secondary flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[14px] text-foreground-muted">
                person
              </span>
            </div>
          ))}
        </div>
        <button
          className="text-[11px] font-black text-primary hover:text-primary-hover transition-colors uppercase tracking-wider"
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
