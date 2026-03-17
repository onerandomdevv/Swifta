"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatKobo } from "@/lib/utils";
import type { Order } from "@swifta/shared";
import { useOrder } from "@/hooks/use-order";
import { OrderTimeline } from "@/components/ui/order-timeline";
import { Modal } from "@/components/ui/modal";
import { downloadInvoice } from "@/lib/api/order.api";

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return { label: "Pending Payment", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" };
    case "PAID":
      return { label: "Confirmed", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" };
    case "PREPARING":
      return { label: "Preparing", bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400" };
    case "DISPATCHED":
      return { label: "Dispatched", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" };
    case "DELIVERED":
      return { label: "Delivered", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" };
    case "COMPLETED":
      return { label: "Completed", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" };
    case "CANCELLED":
      return { label: "Cancelled", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" };
    case "DISPUTE":
      return { label: "Disputed", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" };
    default:
      return { label: status, bg: "bg-slate-100", text: "text-slate-600" };
  }
}

function getPaymentStatusLabel(status: string) {
  switch (status) {
    case "PENDING_PAYMENT": return "Awaiting Escrow";
    case "PAID": return "Escrow Secured";
    case "PREPARING": return "Funds Locked";
    case "DISPATCHED": return "Escrow Active";
    case "DELIVERED": return "Pending Release";
    case "COMPLETED": return "Funds Released";
    case "CANCELLED": return "Refunded";
    default: return "Processing";
  }
}

export default function BuyerOrderDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const {
    order,
    loading,
    error,
    existingReview,
    paying,
    onPay,
    confirming,
    confirmingOtp,
    setConfirmingOtp,
    onConfirmDelivery,
    reportIssue,
  } = useOrder(id);

  const [activeTab, setActiveTab] = useState<"MANIFEST" | "TIMELINE">("MANIFEST");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const handleDownloadInvoice = async () => {
    try {
      const blob = await downloadInvoice(order?.id as string);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${order?.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Failed to download invoice:", err);
    }
  };

  // Resolve line items from different order types
  const lineItems = useMemo(() => {
    if (!order) return [];
    const items: { name: string; sku: string; quantity: number; unitPrice: number | bigint }[] = [];

    // Cart checkout
    if (Array.isArray((order as any).items)) {
      items.push(...(order as any).items.map((item: any) => ({
        name: item.name || "Hardware Item",
        sku: `${item.productId?.slice(0, 8)?.toUpperCase() || "GEN"}`,
        quantity: item.quantity,
        unitPrice: item.unitPriceKobo,
      })));
    }
    // Direct order
    else if ((order as any).product) {
      items.push({
        name: (order as any).product.name,
        sku: `${(order as any).product.id.slice(0, 8).toUpperCase()}`,
        quantity: (order as any).quantity || 1,
        unitPrice: (order as any).unitPriceKobo || (order as any).product.pricePerUnitKobo,
      });
    }
    return items;
  }, [order]);

  if (loading) {
    return (
      <div className="h-full bg-background-light dark:bg-background-dark p-8 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="h-full bg-background-light dark:bg-background-dark p-8 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-red-500">priority_high</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Order Not Found</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-1">{error || "The requested order could not be retrieved."}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm transition-all hover:bg-emerald-600"
        >
          Return to Orders
        </button>
      </div>
    );
  }

  const handleReportIssue = async () => {
    if (!disputeReason.trim()) return;
    setReporting(true);
    try {
      await reportIssue(disputeReason);
      setShowDisputeModal(false);
      setDisputeReason("");
    } catch {
      // handled in hook
    } finally {
      setReporting(false);
    }
  };

  const badge = getStatusBadge(order.status);
  const merchantName = order.merchant?.businessName || order.merchant?.companyName || "Verified Merchant";
  const shortId = `ST-${id.slice(0, 5).toUpperCase()}`;
  const isPaymentPending = order.status === "PENDING_PAYMENT";
  const isDispatched = order.status === "DISPATCHED" || order.status === "DELIVERED";
  const isCompleted = order.status === "COMPLETED" || order.status === "DELIVERED";

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display text-slate-900 dark:text-slate-100">
      <script src="https://js.paystack.co/v1/inline.js" async></script>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-6">
        {/* Breadcrumbs & Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link href="/buyer/orders" className="hover:text-primary transition-colors">Orders</Link>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary font-medium">{shortId}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3 flex-wrap">
              Order #{shortId}
              <span className={`${badge.bg} ${badge.text} text-xs px-3 py-1 rounded-full uppercase tracking-widest font-bold`}>
                {badge.label}
              </span>
            </h1>
          </div>
          <div className="flex gap-3">
            {["PAID", "PREPARING", "DISPATCHED", "DELIVERED", "COMPLETED"].includes(order.status) && (
              <button
                onClick={handleDownloadInvoice}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Invoice
              </button>
            )}
            {isPaymentPending && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold uppercase tracking-widest border border-amber-100 dark:border-amber-900/20">
                <span className="material-symbols-outlined text-sm">schedule</span>
                Awaiting Payment
              </div>
            )}
          </div>
        </div>

        {/* Management Terminal Dashboard — 4 Dark KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Asset Value */}
          <div className="bg-[#0f172a] dark:bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Order Value</p>
            <div className="mt-2">
              <span className="text-white text-3xl font-black">{formatKobo(order.totalAmountKobo)}</span>
              <p className="text-primary text-xs mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                {order.currency}
              </p>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-[#0f172a] dark:bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Payment Status</p>
            <div className="mt-2 flex items-center gap-2">
              <div className={`size-2 rounded-full ${isPaymentPending ? "bg-amber-500 animate-pulse" : "bg-primary"}`}></div>
              <span className="text-white text-2xl font-bold">{getPaymentStatusLabel(order.status)}</span>
            </div>
          </div>

          {/* Terminal ID */}
          <div className="bg-[#0f172a] dark:bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Order ID</p>
            <div className="mt-2">
              <span className="text-white text-2xl font-mono">{id.slice(0, 9).toUpperCase()}</span>
              <p className="text-slate-500 text-xs mt-1">Region: {order.deliveryDetails?.state || "NG"}</p>
            </div>
          </div>

          {/* Seller Reputation */}
          <div className="bg-[#0f172a] dark:bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Seller Rating</p>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className="text-primary material-symbols-outlined">grade</span>
              ))}
              <span className="text-slate-600 material-symbols-outlined">grade</span>
              <span className="text-white ml-2 font-bold text-lg">4.2/5</span>
            </div>
          </div>
        </div>

        {/* Delivery Confirmation Panel — Contextual (show for DISPATCHED) */}
        {isDispatched && (
          <div className="bg-white dark:bg-slate-900 border-2 border-primary/20 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">verified</span>
              </div>
              <div>
                <h3 className="text-lg font-bold">Confirm Delivery</h3>
                <p className="text-slate-500 text-sm">Enter the code sent to you to confirm you have received your order.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                maxLength={6}
                value={confirmingOtp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setConfirmingOtp(val);
                }}
                placeholder="0 0 0 0 0 0"
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-center font-mono tracking-widest text-lg w-full sm:w-48 focus:ring-primary focus:border-primary"
              />
              <button
                onClick={onConfirmDelivery}
                disabled={confirming || confirmingOtp.length !== 6}
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:brightness-110 transition-all whitespace-nowrap disabled:opacity-50"
              >
                {confirming ? "Verifying..." : "Confirm Delivery"}
              </button>
            </div>
          </div>
        )}

        {/* Tabs Section */}
        <div className="space-y-4">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("MANIFEST")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "MANIFEST"
                  ? "border-b-2 border-primary text-primary font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Order Details
            </button>
            <button
              onClick={() => setActiveTab("TIMELINE")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "TIMELINE"
                  ? "border-b-2 border-primary text-primary font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Order Timeline
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Manifest or Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {activeTab === "MANIFEST" ? (
                <>
                  {/* Manifest Table */}
                  <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Item</th>
                          <th className="px-6 py-4">Quantity</th>
                          <th className="px-6 py-4">Unit Price</th>
                          <th className="px-6 py-4 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {lineItems.length > 0 ? (
                          lineItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="size-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-500">inventory_2</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                                    <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-slate-600 dark:text-slate-400">
                                {String(item.quantity).padStart(2, "0")} Units
                              </td>
                              <td className="px-6 py-5 text-slate-600 dark:text-slate-400">
                                {formatKobo(item.unitPrice)}
                              </td>
                              <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-white">
                                {formatKobo(Number(item.unitPrice) * Number(item.quantity))}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="size-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                                  <span className="material-symbols-outlined text-slate-500">inventory_2</span>
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{merchantName} — Order</p>
                                  <p className="text-xs text-slate-500">REF: {id.slice(0, 8).toUpperCase()}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-slate-50 dark:bg-slate-800/50">
                        <tr className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-6 py-2 text-right text-xs font-bold text-slate-400 uppercase tracking-widest" colSpan={3}>Subtotal</td>
                          <td className="px-6 py-2 text-right font-mono text-slate-900 dark:text-white">{formatKobo(Number(order.totalAmountKobo) - Number(order.deliveryFeeKobo || 0) - Number(order.platformFeeKobo || 0))}</td>
                        </tr>
                        {order.platformFeeKobo && (
                          <tr>
                            <td className="px-6 py-2 text-right text-xs font-bold text-slate-400 uppercase tracking-widest" colSpan={3}>Platform Fee ({order.platformFeePercent || 0}%)</td>
                            <td className="px-6 py-2 text-right font-mono text-slate-900 dark:text-white">{formatKobo(order.platformFeeKobo)}</td>
                          </tr>
                        )}
                        {order.deliveryFeeKobo && (
                          <tr>
                            <td className="px-6 py-2 text-right text-xs font-bold text-slate-400 uppercase tracking-widest" colSpan={3}>Delivery Fee</td>
                            <td className="px-6 py-2 text-right font-mono text-slate-900 dark:text-white">{formatKobo(order.deliveryFeeKobo)}</td>
                          </tr>
                        )}
                        <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800">
                          <td className="px-6 py-4 text-right font-black text-slate-500 uppercase tracking-wider" colSpan={3}>Grand Total</td>
                          <td className="px-6 py-4 text-right font-black text-2xl text-primary">{formatKobo(order.totalAmountKobo)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Dispute Section */}
                  {!["COMPLETED", "CANCELLED", "DISPUTE"].includes(order.status) && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-red-500 text-3xl">report</span>
                        <div>
                          <h4 className="font-bold text-red-700 dark:text-red-400">Report an Issue</h4>
                          <p className="text-sm text-red-600/70 dark:text-red-400/60">Something wrong? Report this order to our customer support team.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDisputeModal(true)}
                        className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors whitespace-nowrap"
                      >
                        Contact Support
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Timeline Tab */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
                  <OrderTimeline
                    status={order.status}
                    createdAt={order.createdAt}
                    trackingEvents={[]}
                  />
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Shipping Logistics */}
              <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">local_shipping</span>
                  Shipping Logistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Carrier</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {order.deliveryMethod === "PLATFORM_LOGISTICS" ? "Swifta Express" : "Merchant Delivery"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Tracking No.</span>
                    <span className="font-mono text-primary">SW-{id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Est. Arrival</span>
                    <span className="font-medium">
                      {new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-NG", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </div>
                  {/* Delivery Address */}
                  {order.deliveryAddress && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-sm">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Delivery To</span>
                      <p className="font-medium text-slate-900 dark:text-white mt-1">
                        {order.deliveryDetails?.street || order.deliveryAddress}
                      </p>
                      {order.deliveryDetails && (
                        <p className="text-slate-500 text-xs mt-0.5">
                          {order.deliveryDetails.lga}, {order.deliveryDetails.state}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Trader Review Panel */}
              {isCompleted && (
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-lg">thumb_up</span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Rate your Experience</h3>
                  </div>

                  {existingReview ? (
                    <>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        You rated this experience ⭐ {existingReview.rating}/5
                      </p>
                      <Link
                        href={`/buyer/orders/${order.id}/review`}
                        className="w-full py-2 bg-[#0f172a] dark:bg-white dark:text-[#0f172a] text-white rounded-xl text-sm font-bold text-center block"
                      >
                        View Review
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        The order is marked as finalized. Share your experience with the community.
                      </p>
                      <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span key={i} className="material-symbols-outlined text-slate-300 cursor-pointer hover:text-primary transition-colors">star</span>
                        ))}
                      </div>
                      <Link
                        href={`/buyer/orders/${order.id}/review`}
                        className="w-full py-2 bg-[#0f172a] dark:bg-white dark:text-[#0f172a] text-white rounded-xl text-sm font-bold text-center block"
                      >
                        Submit Feedback
                      </Link>
                    </>
                  )}
                </div>
              )}

              {/* Pay Now Card (for Pending state) */}
              {isPaymentPending && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-lg mb-2">Payment Required</h3>
                  <p className="text-sm text-slate-500 mb-4">Complete payment to process your order. Funds are secured via escrow.</p>
                  <button
                    onClick={onPay}
                    disabled={paying}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">payments</span>
                    {paying ? "Initializing..." : `Pay ${formatKobo(order.totalAmountKobo)}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Dispute Modal */}
      <Modal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        title="Report an Issue"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-500">
            Describe the issue you encountered. The Swifta mediation team will review your report within 24 hours.
          </p>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Describe the discrepancy in detail..."
            className="w-full h-40 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm outline-none focus:border-primary transition-all resize-none"
          />
          <div className="flex gap-4">
            <button
              onClick={() => setShowDisputeModal(false)}
              className="flex-1 py-3 text-sm font-medium text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleReportIssue}
              disabled={reporting || !disputeReason.trim()}
              className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-all"
            >
              {reporting ? "Submitting..." : "Submit Issue"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
