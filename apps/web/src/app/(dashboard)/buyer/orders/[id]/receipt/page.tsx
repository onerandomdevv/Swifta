"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getReceipt } from "@/lib/api/order.api";
import { formatKobo } from "@hardware-os/shared";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderReceiptPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    async function fetchReceipt() {
      try {
        const data = await getReceipt(id as string);
        const orderData = (data as any).data ? (data as any).data : data;
        setOrder(orderData);
      } catch (err: any) {
        setError(err?.message || "Failed to load receipt");
      } finally {
        setLoading(false);
      }
    }
    fetchReceipt();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-10 py-4 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <span className="material-symbols-outlined text-5xl text-red-500">
          error
        </span>
        <p className="text-sm font-bold text-red-600 uppercase tracking-wide">
          {error || "Receipt not found"}
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { merchant, buyer, quote, payments } = order;
  const paymentDate = payments?.[0]?.createdAt;
  const productInfo = quote?.rfq?.product || quote?.rfq?.unlistedItemDetails;
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto py-10 print:py-0">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}} />
      
      {/* Action Bar - Hidden on print */}
      <div className="flex justify-between items-center mb-8 print-hide">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-navy-dark uppercase tracking-widest hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Order
        </button>
        
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-navy-dark/20 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">print</span>
          Print Receipt
        </button>
      </div>

      {/* Printable Area */}
      <div id="printable-receipt" className="bg-white rounded-[2rem] border border-slate-200 p-12 print:border-none print:shadow-none shadow-xl shadow-slate-100 relative">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 bg-navy-dark rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white font-bold">bolt</span>
              </div>
              <h1 className="text-2xl font-black text-navy-dark font-display tracking-tight uppercase">
                SwiftTrade
              </h1>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Digital Trade Infrastructure
            </p>
          </div>
          
          <div className="text-right">
            <h2 className="text-4xl font-black text-slate-200 uppercase font-display mb-2">Receipt</h2>
            <p className="text-sm font-black text-navy-dark uppercase tracking-widest">
              # {order.id.slice(0, 16).toUpperCase()}
            </p>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Date: {new Date(paymentDate || order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Sold By
            </p>
            <h3 className="text-base font-black text-navy-dark uppercase tracking-tight mb-2">
              {merchant?.businessName || "Unknown Merchant"}
            </h3>
            {merchant?.businessAddress && (
              <p className="text-sm font-bold text-slate-600 whitespace-pre-line mb-1">
                {merchant.businessAddress}
              </p>
            )}
            <p className="text-sm font-bold text-slate-500">
              Email: {merchant?.user?.email || "N/A"}
              <br />
              Phone: {merchant?.user?.phone || "N/A"}
            </p>
          </div>
          
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Billed To
            </p>
            <p className="text-sm font-bold text-slate-600 mb-1">
              {buyer?.email}
            </p>
            {buyer?.phone && (
              <p className="text-sm font-bold text-slate-600 mb-4">
                {buyer.phone}
              </p>
            )}
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">
              Delivered To
            </p>
            <p className="text-sm font-bold text-slate-600">
              {quote?.rfq?.deliveryAddress}
            </p>
          </div>
        </div>

        {/* Order Details Table */}
        <div className="mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-slate-200 bg-slate-50">
                <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/2">
                  Item Description
                </th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
                  Qty
                </th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                  Unit Price
                </th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-6 px-4">
                  <p className="font-black text-navy-dark text-sm uppercase">
                    {productInfo?.name || "Hardware Supplies"}
                  </p>
                  {productInfo?.description && (
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      {productInfo.description}
                    </p>
                  )}
                </td>
                <td className="py-6 px-4 text-center">
                  <p className="font-black text-navy-dark text-sm">
                    {quote?.rfq?.quantity} {productInfo?.unit || ""}
                  </p>
                </td>
                <td className="py-6 px-4 text-right">
                  <p className="font-bold text-slate-600 text-sm">
                    {formatKobo(quote?.unitPriceKobo || 0)}
                  </p>
                </td>
                <td className="py-6 px-4 text-right">
                  <p className="font-black text-navy-dark text-sm">
                    {formatKobo(BigInt(quote?.unitPriceKobo || 0) * BigInt(quote?.rfq?.quantity || 1))}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-72 space-y-4">
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span>Subtotal</span>
              <span>{formatKobo(BigInt(quote?.unitPriceKobo || 0) * BigInt(quote?.rfq?.quantity || 1))}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span>Delivery Fee</span>
              <span>{formatKobo(order.deliveryFeeKobo)}</span>
            </div>
            <div className="h-px bg-slate-200 my-2"></div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-black text-navy-dark uppercase tracking-widest">Total</span>
              <span className="font-black text-navy-dark">{formatKobo(order.totalAmountKobo)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-green-600 mt-2">
              <span>Status</span>
              <span className="uppercase">{order.status}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-8 flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500">
              Payment processed securely via <span className="text-navy-dark font-black">Paystack</span>
            </p>
            {payments?.[0] && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Ref: {payments[0].reference}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
              Thank you for trading with SwiftTrade
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
}
