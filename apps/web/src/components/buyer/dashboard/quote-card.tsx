import React from "react";
import Link from "next/link";
import { formatKobo } from "@hardware-os/shared";

interface Props {
  rfq: any; // Using any to flexibly handle the RFQ/Quote data shape from useBuyerDashboard
}

export function QuoteCard({ rfq }: Props) {
  // Extract quote details safely depending on whether this is an RFQ object or Quote object
  const quoteData = rfq.quotes?.[0] || rfq;
  const merchantName = rfq.merchant?.businessName || quoteData.merchant?.businessName || "Verified Supplier";
  const productName = rfq.product?.name || "Industrial Material";

  const unitPrice = BigInt(quoteData.unitPriceKobo || 0);
  const deliveryFee = BigInt(quoteData.deliveryFeeKobo || 0);
  const totalQuote = BigInt(quoteData.totalPriceKobo || quoteData.totalAmountKobo || 0);

  return (
    <div className="bg-white border border-slate-200 p-4 lg:p-6 flex flex-col md:flex-row gap-6 items-start rounded">
      {/* Product Image Placeholder */}
      <div
        className="w-full md:w-32 h-32 bg-slate-100 flex-shrink-0 border border-slate-100"
        style={{
          backgroundImage: rfq.product?.imageUrl ? `url("${rfq.product.imageUrl}")` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!rfq.product?.imageUrl && (
            <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
            </div>
        )}
      </div>

      <div className="flex-1 space-y-3 w-full">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{productName}</h3>
            <p className="text-slate-600 flex items-center gap-1 font-medium">
              {merchantName}
              <span className="material-symbols-outlined text-green-600 text-sm font-bold">
                check_circle
              </span>
            </p>
          </div>

          <div className="flex flex-col font-mono text-sm border-l-2 border-slate-100 pl-4 py-1 min-w-[200px]">
            <div className="flex justify-between gap-8">
              <span className="text-slate-500">Unit Price:</span>
              <span className="font-bold text-slate-900">{formatKobo(unitPrice)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-slate-500">Delivery:</span>
              <span className="font-bold text-slate-900">{formatKobo(deliveryFee)}</span>
            </div>
            <div className="flex justify-between gap-8 pt-1 border-t border-slate-100 mt-1">
              <span className="text-slate-900">Total Quote:</span>
              <span className="font-bold text-primary">{formatKobo(totalQuote)}</span>
            </div>
          </div>
        </div>

        <Link
          href={`/buyer/rfqs/${rfq.id}`}
          className="w-full lg:w-auto bg-primary text-white font-bold py-3 px-8 rounded hover:bg-primary/90 transition-colors uppercase tracking-wide text-sm inline-block text-center"
        >
          Accept & Pay Escrow
        </Link>
      </div>
    </div>
  );
}
