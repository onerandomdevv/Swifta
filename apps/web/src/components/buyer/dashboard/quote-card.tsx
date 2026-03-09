import React from "react";
import Link from "next/link";
import { formatKobo } from "@hardware-os/shared";

interface Props {
  rfq: any; // Using any to flexibly handle the RFQ/Quote data shape from useBuyerDashboard
}

export function QuoteCard({ rfq }: Props) {
  // Extract quote details safely depending on whether this is an RFQ object or Quote object
  const quoteData = rfq.quotes?.[0] || rfq;
  const merchantName =
    rfq.merchant?.businessName ||
    quoteData.merchant?.businessName ||
    "Verified Supplier";
  const productName = rfq.product?.name || "Industrial Material";

  const unitPrice = BigInt(quoteData.unitPriceKobo || 0);
  const deliveryFee = BigInt(quoteData.deliveryFeeKobo || 0);
  const totalQuote = BigInt(
    quoteData.totalPriceKobo || quoteData.totalAmountKobo || 0,
  );

  return (
    <div className="bg-white border border-slate-200 p-4 lg:p-6 flex flex-col items-start gap-4 sm:gap-6 rounded shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full">
        {/* Product Image Placeholder */}
        <div
          className="w-full sm:w-28 sm:h-28 h-48 bg-slate-50 flex-shrink-0 border border-slate-100 rounded"
          style={{
            backgroundImage: rfq.product?.imageUrl
              ? `url("${rfq.product.imageUrl}")`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {!rfq.product?.imageUrl && (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">
                inventory_2
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">
                {productName}
              </h3>
              <p className="text-slate-500 flex items-center gap-1.5 text-sm font-bold">
                {merchantName}
                <span className="material-symbols-outlined text-primary text-[16px]">
                  verified
                </span>
              </p>
            </div>

            <div className="flex flex-col font-mono text-sm border-t sm:border-t-0 sm:border-l sm:pl-4 pt-3 sm:pt-1 sm:min-w-[180px] border-slate-100">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  Price:
                </span>
                <span className="font-bold text-slate-900">
                  {formatKobo(unitPrice)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  Fee:
                </span>
                <span className="font-bold text-slate-900">
                  {formatKobo(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between gap-4 pt-1 border-t border-slate-100 mt-1">
                <span className="text-slate-900 uppercase text-[10px] tracking-wider font-extrabold">
                  Total:
                </span>
                <span className="font-extrabold text-primary">
                  {formatKobo(totalQuote)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href={`/buyer/rfqs/${rfq.id}`}
              className="w-full sm:w-auto bg-primary text-white font-bold py-3.5 px-8 rounded-lg hover:bg-primary-dark transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20"
            >
              <span>Accept & Pay Escrow</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                payments
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
