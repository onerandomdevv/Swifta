"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useBuyerRFQs } from "@/hooks/use-buyer-rfqs";
import type { RFQ } from "@hardware-os/shared";

const STATUS_TABS = [
  { label: "All", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "Quoted", value: "QUOTED" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Cancelled", value: "CANCELLED" },
];

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-blue-100 text-blue-700";
    case "QUOTED":
      return "bg-amber-100 text-amber-700";
    case "ACCEPTED":
      return "bg-green-100 text-green-700";
    case "EXPIRED":
      return "bg-slate-100 text-slate-600";
    case "CANCELLED":
      return "bg-red-50 text-red-600";
    case "DECLINED":
      return "bg-red-50 text-red-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getExpiryDisplay(rfq: RFQ) {
  if (rfq.status === "ACCEPTED") {
    return <span className="text-xs text-slate-500">Order Created</span>;
  }
  if (rfq.status === "EXPIRED") {
    return (
      <span className="text-xs text-red-500">
        Expired{" "}
        {new Date(rfq.expiresAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>
    );
  }
  if (rfq.status === "CANCELLED") {
    return <span className="text-xs text-slate-500">Closed by Buyer</span>;
  }
  return (
    <span className="text-xs text-slate-500">
      Expires:{" "}
      {new Date(rfq.expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}
    </span>
  );
}

function RFQListSkeleton() {
  return (
    <div className="px-8 pt-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>
      <div className="flex gap-4 border-b border-slate-200 pb-0">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-10 w-20" />
        ))}
      </div>
      <div className="space-y-0 border border-slate-200 rounded">
        <Skeleton className="h-12 w-full" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function BuyerRFQsPage() {
  const { rfqs, loading, error, refetch } = useBuyerRFQs();
  const [activeTab, setActiveTab] = useState("ALL");

  if (loading) return <RFQListSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-red-400">
          error
        </span>
        <p className="text-sm font-bold text-red-600 uppercase tracking-wide">
          {error}
        </p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2 bg-primary text-white rounded text-sm font-bold uppercase tracking-wide"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredRFQs =
    activeTab === "ALL" ? rfqs : rfqs.filter((r) => r.status === activeTab);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight uppercase">
              MY REQUESTS
            </h1>
            <p className="text-primary text-xs font-bold tracking-widest mt-1">
              PROCUREMENT RFQs • MANAGE QUOTES
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/buyer/rfqs/new-custom"
              className="flex h-10 items-center justify-center rounded border border-slate-300 px-4 text-sm font-bold tracking-wide hover:bg-slate-50"
            >
              REQUEST UNLISTED ITEM
            </Link>
            <Link
              href="/buyer/catalogue"
              className="flex h-10 items-center justify-center rounded bg-primary px-4 text-white text-sm font-bold tracking-wide hover:bg-primary/90"
            >
              NEW MATERIAL RFQ
            </Link>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="px-8 mt-4">
        <div className="flex border-b border-slate-200">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "border-primary font-bold text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* RFQ Table */}
      <div className="px-8 mt-6 pb-8">
        {filteredRFQs.length > 0 ? (
          <>
            {/* Table Header (Desktop) */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-t text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <div className="col-span-2">RFQ ID / Status</div>
              <div className="col-span-4">Product Details</div>
              <div className="col-span-2">Created Date</div>
              <div className="col-span-3 text-right">Merchant / Expiry</div>
              <div className="col-span-1"></div>
            </div>

            {/* Data Rows */}
            {filteredRFQs.map((rfq) => (
              <div
                key={rfq.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 py-5 border-x border-b border-slate-200 items-center hover:bg-slate-50/50 transition-colors"
              >
                {/* RFQ ID + Status */}
                <div className="lg:col-span-2 flex flex-col gap-2">
                  <span className="font-mono text-sm font-medium text-slate-600">
                    RFQ {rfq.id.slice(0, 8)}
                  </span>
                  <span
                    className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadgeClasses(rfq.status)}`}
                  >
                    {rfq.status}
                  </span>
                </div>

                {/* Product Details */}
                <div className="lg:col-span-4 flex flex-col">
                  <span className="font-bold text-slate-900">
                    {rfq.product?.name ||
                      rfq.unlistedItemDetails?.name ||
                      "Custom Request"}
                  </span>
                  <span className="text-sm text-slate-500 font-mono">
                    Qty: {rfq.quantity} {rfq.product?.unit || "units"}
                  </span>
                </div>

                {/* Created Date */}
                <div className="lg:col-span-2 font-mono text-sm text-slate-600">
                  {new Date(rfq.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                {/* Merchant / Expiry */}
                <div className="lg:col-span-3 lg:text-right flex flex-col">
                  <span className="text-sm font-bold text-slate-900">
                    {rfq.merchant?.businessName || "—"}
                  </span>
                  {getExpiryDisplay(rfq)}
                </div>

                {/* Chevron */}
                <div className="lg:col-span-1 flex lg:justify-end">
                  <Link
                    href={`/buyer/rfqs/${rfq.id}`}
                    className="size-8 flex items-center justify-center rounded border border-slate-200 hover:border-primary hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      chevron_right
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 border border-slate-200 rounded bg-white">
            <span className="material-symbols-outlined text-6xl text-slate-300">
              contract
            </span>
            <div className="space-y-2">
              <h3 className="text-xl font-bold uppercase tracking-tight">
                No Active Requests
              </h3>
              <p className="text-sm text-slate-500">
                Start a new request to receive quotes from verified suppliers.
              </p>
            </div>
            <Link
              href="/buyer/catalogue"
              className="px-6 py-3 bg-primary text-white rounded text-sm font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors"
            >
              CREATE FIRST RFQ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
