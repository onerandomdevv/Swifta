"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getWholesaleCatalogue,
  getRecommendedCatalogue,
  createWholesaleOrder,
} from "@/lib/api/supplier.api";
import {
  checkTradeFinancingEligibility,
  applyForTradeFinancing,
  type TradeFinancingEligibilityResponse,
} from "@/lib/api/trade-financing.api";
import { formatKobo } from "@hardware-os/shared";
import { useToast } from "@/providers/toast-provider";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { WholesaleCard } from "@/components/merchant/wholesale/wholesale-card";

export default function WholesaleCataloguePage() {
  const toast = useToast();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "PAY_NOW" | "TRADE_FINANCING"
  >("PAY_NOW");
  const [tenureDays, setTenureDays] = useState(30);
  const [eligibility, setEligibility] =
    useState<TradeFinancingEligibilityResponse | null>(null);

  const {
    data: catalogue,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["wholesale", "catalogue"],
    queryFn: getWholesaleCatalogue,
  });

  const { data: recommended } = useQuery({
    queryKey: ["wholesale", "recommended"],
    queryFn: getRecommendedCatalogue,
  });

  useEffect(() => {
    checkTradeFinancingEligibility()
      .then(setEligibility)
      .catch((err) => {
        console.error(err);
        toast.error("Failed to check Trade Financing eligibility.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderMutation = useMutation({
    mutationFn: createWholesaleOrder,
    onSuccess: async (data: any) => {
      if (paymentMethod === "TRADE_FINANCING") {
        try {
          await applyForTradeFinancing({
            orderId: data.orderId,
            tenureDays,
          });
          toast.success("Trade financing application successful!");
          window.location.href = `/merchant/orders/${data.orderId}?success=financing_approved`;
        } catch (err: any) {
          toast.error(
            err.message ||
              "Financing application failed. Redirecting to regular payment...",
          );
          if (data.authorizationUrl) {
            window.location.href = data.authorizationUrl;
            return; // Don't close modal yet if redirecting
          }
        }
      } else {
        toast.success("Order created! Redirecting to payment...");
        if (data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
          return;
        }
        setSelectedProduct(null);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create order");
    },
  });

  const handleOpenOrder = (product: any) => {
    setSelectedProduct(product);
    setQuantity(product.minOrderQty);
    setPaymentMethod("PAY_NOW");
  };

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    orderMutation.mutate({
      productId: selectedProduct.id,
      quantity: Number(quantity),
      deliveryAddress: address,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Manufacturer Directory
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Buy stock directly from manufacturers and large distributors at
          wholesale prices.
        </p>
      </div>

      {/* Recommended Section */}
      {recommended && recommended.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-500">
              auto_awesome
            </span>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
              Recommended for you
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommended
              .filter((item: any) => item.isRecommended)
              .slice(0, 3)
              .map((item: any) => (
                <WholesaleCard
                  key={item.id}
                  item={item}
                  onOrder={handleOpenOrder}
                  isRecommended={true}
                />
              ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : !catalogue || catalogue.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
            factory
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            No active suppliers
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Manufacturer stock will appear here once verified suppliers list
            their products.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
            All Suppliers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogue.map((item: any) => (
              <WholesaleCard
                key={item.id}
                item={item}
                onOrder={handleOpenOrder}
              />
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Place Wholesale Order"
      >
        <form onSubmit={handleOrder} className="p-8 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <div className="size-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-primary">
                inventory
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                {selectedProduct?.name}
              </h4>
              <p className="text-xs text-slate-500">
                {selectedProduct?.supplier?.companyName}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-lg font-black text-primary">
                {selectedProduct &&
                  formatKobo(selectedProduct.wholesalePriceKobo)}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                per {selectedProduct?.unit}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Order Quantity
              </label>
              <input
                type="number"
                min={selectedProduct?.minOrderQty}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                required
              />
              <p className="text-[10px] text-slate-400 font-medium ml-1">
                Minimum: {selectedProduct?.minOrderQty} {selectedProduct?.unit}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Total Estimate
              </label>
              <div className="h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 flex items-center">
                <p className="text-lg font-black text-navy-dark dark:text-white tabular-nums">
                  {selectedProduct &&
                    formatKobo(
                      BigInt(selectedProduct.wholesalePriceKobo) *
                        BigInt(quantity || 0),
                    )}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("PAY_NOW")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  paymentMethod === "PAY_NOW"
                    ? "border-primary bg-primary/5"
                    : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                }`}
              >
                <p className="text-xs font-black uppercase text-slate-900 dark:text-white">
                  Pay Now
                </p>
                <p className="text-[10px] text-slate-500 mt-1 font-medium italic">
                  Direct Payment
                </p>
              </button>

              <button
                type="button"
                disabled={!eligibility?.eligible}
                onClick={() => setPaymentMethod("TRADE_FINANCING")}
                className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${
                  paymentMethod === "TRADE_FINANCING"
                    ? "border-indigo-500 bg-indigo-50"
                    : eligibility?.eligible
                      ? "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                      : "border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed"
                }`}
              >
                {!eligibility?.eligible && (
                  <div className="absolute top-1 right-1">
                    <span className="material-symbols-outlined text-slate-300 text-xs">
                      lock
                    </span>
                  </div>
                )}
                <p className="text-xs font-black uppercase text-slate-900 dark:text-white">
                  Trade Financing
                </p>
                <p className="text-[10px] text-slate-500 mt-1 font-medium italic">
                  Stock Financing
                </p>
              </button>
            </div>

            {paymentMethod === "TRADE_FINANCING" && eligibility && (
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-300">
                <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">
                  💳 Available Credit:{" "}
                  {formatKobo(BigInt(eligibility.maxAmount))}
                </p>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    Choose Repayment Period
                  </label>
                  <div className="flex gap-2">
                    {[30, 60, 90].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setTenureDays(days)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
                          tenureDays === days
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-indigo-600 border border-indigo-200"
                        }`}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[9px] text-indigo-500 italic font-medium">
                  Interest rate: {eligibility.interestRate}% flat
                </p>
              </div>
            )}

            {!eligibility?.eligible && eligibility && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wide leading-relaxed">
                  ⚠️ Financing locked:{" "}
                  {eligibility.reason ||
                    "Verification tier or trade history requirements not met."}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              Delivery Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-medium text-slate-900 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
              placeholder="Enter the full delivery address for this stock..."
              required
            />
          </div>

          <Button
            type="submit"
            className={`w-full h-14 ${paymentMethod === "TRADE_FINANCING" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
            isLoading={orderMutation.isPending}
            disabled={
              !quantity || quantity < (selectedProduct?.minOrderQty || 0)
            }
          >
            {paymentMethod === "TRADE_FINANCING"
              ? "Apply for Financing"
              : "Confirm & Proceed to Payment"}
          </Button>

          <p className="text-center text-[10px] text-slate-400 font-medium px-4">
            {paymentMethod === "TRADE_FINANCING"
              ? "Application will be cross-checked with our financing partner instantly."
              : "By clicking confirm, you agree to the Swifta Escrow terms."}
          </p>
        </form>
      </Modal>

      <div className="absolute inset-0 z-[100] backdrop-blur-md bg-white/40 dark:bg-slate-900/40 flex flex-col items-center justify-center p-8 animate-in fade-in duration-1000">
        <div className="max-w-md w-full p-12 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl text-center space-y-8">
           <div className="size-24 rounded-[2rem] bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl text-amber-500 animate-pulse">factory</span>
           </div>
           <div className="space-y-3">
              <h2 className="text-3xl font-black text-navy-dark dark:text-white uppercase tracking-tighter">Manufacturer Trade</h2>
              <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest bg-amber-50/50 dark:bg-amber-900/30 px-3 py-1 rounded-full inline-block">Initial Launch Pending</p>
           </div>
           <p className="text-slate-500 font-bold text-sm leading-relaxed">
              We are currently finalizing our Industrial Supplier Verification protocols. Wholesale inventory and Trade Financing will be initialized in Phase 2.
           </p>
           <button 
             onClick={() => window.location.href = "/merchant/dashboard"}
             className="px-10 py-5 bg-navy-dark dark:bg-white text-white dark:text-navy-dark rounded-[1.25rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-navy-dark/20 hover:scale-105 active:scale-95 transition-all w-full"
           >
             Return to Dashboard
           </button>
        </div>
      </div>
    </div>
  );
}
