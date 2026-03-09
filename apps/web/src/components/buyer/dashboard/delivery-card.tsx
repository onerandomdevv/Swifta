import React from "react";
import Link from "next/link";
import type { Order } from "@hardware-os/shared";

interface Props {
  order: Order;
}

export function DeliveryCard({ order }: Props) {
  // Format the ID for display
  const shortId = `#ORD-${order.id.slice(0, 5).toUpperCase()}`;

  // Use the delivery address from the order metadata if available, otherwise generic
  const location =
    (order as any).metadata?.deliveryAddress || "Lagos Delivery Terminal";

  // Determine color coding based on status
  let statusBadgeClasses = "";
  let statusText: string = order.status;

  switch (order.status) {
    case "PENDING_PAYMENT":
      statusBadgeClasses = "bg-red-100 text-red-800 border-red-200";
      statusText = "Payment Required";
      break;
    case "PAID":
      statusBadgeClasses = "bg-amber-100 text-amber-800 border-amber-200";
      statusText = "Awaiting Dispatch";
      break;
    case "DISPATCHED":
      statusBadgeClasses = "bg-blue-100 text-blue-800 border-blue-200";
      statusText = "In Transit";
      break;
    case "COMPLETED":
      statusBadgeClasses = "bg-green-100 text-green-800 border-green-200";
      statusText = "Delivered";
      break;
    default:
      statusBadgeClasses = "bg-slate-100 text-slate-800 border-slate-200";
      break;
  }

  // Determine product name via RFQ linkage (hardware-os specific structure)
  // Typically, an order wraps an RFQ which wraps a product.
  const productName =
    (order as any).rfq?.product?.name || "Industrial Materials Shipment";

  return (
    <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 border border-slate-200 text-xs sm:text-sm rounded">
            {shortId}
          </span>
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] sm:text-xs font-black border uppercase tracking-widest ${statusBadgeClasses}`}
          >
            {statusText}
          </span>
        </div>
        <div>
          <h4 className="text-slate-900 text-sm sm:text-base font-black leading-tight mb-0.5">
            {productName}
          </h4>
          <p className="text-slate-500 text-xs sm:text-sm font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">
              location_on
            </span>
            {location}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full lg:w-auto pt-2 lg:pt-0">
        {/* Track Truck — only when dispatched */}
        {order.status === "DISPATCHED" && (
          <Link
            href={`/buyer/orders/${order.id}`}
            className="w-full sm:w-auto border border-primary text-primary text-center font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-widest transition-all hover:bg-primary/5 shadow-sm"
          >
            Track Truck
          </Link>
        )}

        {/* Fund Escrow — only when payment pending */}
        {order.status === "PENDING_PAYMENT" && (
          <Link
            href={`/buyer/orders/${order.id}`}
            className="w-full sm:w-auto bg-primary text-white text-center font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Fund Escrow
          </Link>
        )}

        {/* Enter Delivery OTP — active link only when dispatched, non-navigable span otherwise */}
        {order.status === "DISPATCHED" ? (
          <Link
            href={`/buyer/orders/${order.id}`}
            className="w-full sm:w-auto bg-primary text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-widest hover:bg-primary/90 transition-all text-center shadow-lg shadow-primary/20"
          >
            Enter Delivery OTP
          </Link>
        ) : (
          <span
            aria-disabled="true"
            role="button"
            className="w-full sm:w-auto font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-widest text-center bg-slate-50 text-slate-300 cursor-not-allowed select-none border border-slate-100"
          >
            Enter Delivery OTP
          </span>
        )}
      </div>
    </div>
  );
}
