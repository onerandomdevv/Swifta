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
      statusBadgeClasses =
        "bg-red-100 text-red-800 border-red-200";
      statusText = "Payment Required";
      break;
    case "PAID":
      statusBadgeClasses =
        "bg-amber-100 text-amber-800 border-amber-200";
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
  const productName = (order as any).rfq?.product?.name || "Industrial Materials Shipment";

  return (
    <div className="bg-white border border-slate-200 p-5 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 border border-slate-200">
            {shortId}
          </span>
          <span
            className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-bold border uppercase tracking-wider ${statusBadgeClasses}`}
          >
            {statusText}
          </span>
        </div>
        <p className="text-slate-600 text-sm font-medium">
          {productName} • {location}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Track Truck — only when dispatched */}
        {order.status === "DISPATCHED" && (
          <Link
            href={`/buyer/orders/${order.id}`}
            className="flex-1 lg:flex-none border border-primary text-primary text-center font-bold py-2 px-6 rounded text-sm uppercase transition-colors hover:bg-primary/5"
          >
            Track Truck
          </Link>
        )}

        {/* Fund Escrow — only when payment pending */}
        {order.status === "PENDING_PAYMENT" && (
          <Link
            href={`/buyer/orders/${order.id}`}
            className="flex-1 lg:flex-none bg-primary text-white text-center font-bold py-2 px-6 rounded text-sm uppercase hover:bg-primary/90 transition-colors"
          >
            Fund Escrow
          </Link>
        )}

        {/* Enter Delivery OTP — active link only when dispatched, non-navigable span otherwise */}
        {order.status === "DISPATCHED" ? (
          <Link
            href={`/buyer/orders/${order.id}`}
            className="flex-1 lg:flex-none bg-primary text-white font-bold py-2 px-6 rounded text-sm uppercase hover:bg-primary/90 transition-colors text-center"
          >
            Enter Delivery OTP
          </Link>
        ) : (
          <span
            aria-disabled="true"
            role="button"
            className="flex-1 lg:flex-none font-bold py-2 px-6 rounded text-sm uppercase text-center bg-slate-100 text-slate-400 cursor-not-allowed select-none"
          >
            Enter Delivery OTP
          </span>
        )}
      </div>
    </div>
  );
}
