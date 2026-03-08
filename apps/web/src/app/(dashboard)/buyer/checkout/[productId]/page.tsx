"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getProduct } from "@/lib/api/product.api";
import { createDirectOrder, getDeliveryQuote } from "@/lib/api/order.api";
import { useAuth } from "@/providers/auth-provider";
import type { Product } from "@hardware-os/shared";

type PaymentMethod = "ESCROW" | "DIRECT";

export default function CheckoutPage({
  params,
}: {
  params: { productId: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ESCROW");
  const [deliveryMethod, setDeliveryMethod] = useState<
    "MERCHANT_DELIVERY" | "PLATFORM_LOGISTICS"
  >("MERCHANT_DELIVERY");
  const [deliveryQuoteKobo, setDeliveryQuoteKobo] = useState<number | null>(
    null,
  );
  const [isQuoting, setIsQuoting] = useState(false);
  const [showMerchantDisclaimer, setShowMerchantDisclaimer] = useState(true);

  const merchantTier = (product as any)?.merchantProfile?.verificationTier;
  const isVerifiedMerchant =
    merchantTier === "VERIFIED" || merchantTier === "TRUSTED";

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await getProduct(params.productId);
        if (!response.pricePerUnitKobo) {
          router.replace(`/buyer/rfqs/new?productId=${response.id}`);
          return;
        }
        setProduct(response);
        setQuantity(response.minOrderQuantity || 1);
      } catch (err: any) {
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [params.productId, router]);

  const minQuantity = product?.minOrderQuantity || 1;
  const isBelowMin = quantity < minQuantity;

  const createOrderMutation = useMutation({
    mutationFn: createDirectOrder,
    onError: (err: any) => {
      setError(err?.message || "Payment initialization failed");
    },
    onSuccess: async (data) => {
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setError("Invalid payment URL returned");
      }
    },
  });

  // Fetch Delivery Quote when address & product are available and PLATFORM_LOGISTICS is selected
  useEffect(() => {
    const fetchQuote = async () => {
      if (
        deliveryMethod !== "PLATFORM_LOGISTICS" ||
        deliveryAddress.length < 5 ||
        !product
      ) {
        setDeliveryQuoteKobo(null);
        return;
      }

      const pickupAddress = (product as any)?.merchantProfile?.businessAddress;
      if (!pickupAddress) return;

      setIsQuoting(true);
      try {
        const estimatedWeightKg =
          product.unit.toLowerCase() === "bag" ? 50 * quantity : 1 * quantity;
        const quote = await getDeliveryQuote(
          pickupAddress,
          deliveryAddress,
          estimatedWeightKg,
        );
        setDeliveryQuoteKobo(Number(quote.costKobo));
      } catch (err) {
        setDeliveryQuoteKobo(null);
        console.error("Failed to fetch delivery quote", err);
      } finally {
        setIsQuoting(false);
      }
    };

    const delayDebounceFn = setTimeout(() => fetchQuote(), 800);
    return () => clearTimeout(delayDebounceFn);
  }, [deliveryMethod, deliveryAddress, quantity, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setError(null);
    createOrderMutation.mutate({
      productId: product.id,
      quantity,
      deliveryAddress,
      paymentMethod: isVerifiedMerchant ? paymentMethod : "ESCROW",
      deliveryMethod,
    });
  };

  const isSubmitting = createOrderMutation.isPending;

  const priceKobo = product?.pricePerUnitKobo
    ? Number(product.pricePerUnitKobo)
    : 0;
  const subtotalKobo = priceKobo * quantity;
  const feePercentage =
    paymentMethod === "DIRECT" && isVerifiedMerchant ? 1 : 2;
  const platformFeeKobo = Math.floor(subtotalKobo * (feePercentage / 100));
  const activeDeliveryFeeKobo =
    deliveryMethod === "PLATFORM_LOGISTICS" ? deliveryQuoteKobo || 0 : 0;
  const totalKobo = subtotalKobo + platformFeeKobo + activeDeliveryFeeKobo;

  const formatMoney = (kobo: number) =>
    (kobo / 100).toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    });

  const showPaymentMethodSection = isVerifiedMerchant;

  if (loading) {
    return (
      <div className="space-y-8 py-4 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <Skeleton className="size-10 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-sm" />
        </div>
        <div className="bg-white border border-slate-200 rounded p-10 space-y-8">
          <Skeleton className="h-12 w-full rounded-sm" />
          <Skeleton className="h-48 w-full rounded-sm" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 font-bold uppercase text-xs">
          Product not found or unavailable for direct purchase.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="size-10 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div className="space-y-0.5">
          <h1 className="text-[28px] font-bold uppercase tracking-tight leading-tight">
            Checkout
          </h1>
          <p className="text-primary text-xs font-bold tracking-widest uppercase">
            SECURE DIRECT PURCHASE
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded flex gap-3">
          <span className="material-symbols-outlined text-red-600">error</span>
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide flex items-center">
            {error}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start"
      >
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase text-slate-800 tracking-widest border-b border-slate-100 pb-3">
              Delivery Details
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  DELIVERY ADDRESS
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:bg-white transition-all"
                  placeholder="Enter full delivery address in Lagos"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  QUANTITY ({product.unit.toUpperCase()})
                </label>
                <input
                  type="number"
                  min={minQuantity}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className={`w-full bg-slate-50 border rounded py-3 px-4 text-sm font-mono font-medium text-slate-900 outline-none transition-all ${
                    isBelowMin
                      ? "border-red-400 bg-red-50"
                      : "border-slate-300 focus:border-primary focus:bg-white"
                  }`}
                />
                {isBelowMin && (
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight mt-1 ml-1">
                    Minimum order requirement is {minQuantity}.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase text-slate-800 tracking-widest border-b border-slate-100 pb-3">
              Delivery Method
            </h2>

            <label
              className={`flex items-start gap-4 p-4 rounded border-2 cursor-pointer transition-all ${
                deliveryMethod === "MERCHANT_DELIVERY"
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => setDeliveryMethod("MERCHANT_DELIVERY")}
            >
              <input
                type="radio"
                name="deliveryMethod"
                value="MERCHANT_DELIVERY"
                checked={deliveryMethod === "MERCHANT_DELIVERY"}
                onChange={() => setDeliveryMethod("MERCHANT_DELIVERY")}
                className="mt-1 accent-primary"
              />
              <div className="flex-1">
                <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                  Merchant Delivery
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Merchant handles shipping. Tracking is updated manually. Free
                  or merchant-specified.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-4 p-4 rounded border-2 cursor-pointer transition-all ${
                deliveryMethod === "PLATFORM_LOGISTICS"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => setDeliveryMethod("PLATFORM_LOGISTICS")}
            >
              <input
                type="radio"
                name="deliveryMethod"
                value="PLATFORM_LOGISTICS"
                checked={deliveryMethod === "PLATFORM_LOGISTICS"}
                onChange={() => setDeliveryMethod("PLATFORM_LOGISTICS")}
                className="mt-1 accent-indigo-500"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
                    SwiftTrade Delivery
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">
                      📍 GPS TRACKED
                    </span>
                  </p>
                  <p className="text-sm font-black text-indigo-600">
                    {isQuoting
                      ? "..."
                      : deliveryQuoteKobo
                        ? formatMoney(deliveryQuoteKobo)
                        : ""}
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Professional tracked delivery. Requires a full delivery
                  address.
                </p>
              </div>
            </label>

            {/* Merchant Delivery Disclaimer */}
            {deliveryMethod === "MERCHANT_DELIVERY" &&
              showMerchantDisclaimer && (
                <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-500 mt-0.5 text-lg">
                      info
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-black text-amber-800 uppercase tracking-wide mb-2">
                        📦 Merchant Delivery Selected
                      </p>
                      <ul className="space-y-1 text-[11px] text-amber-700 font-medium">
                        <li>
                          ✅ Your payment is still 100% protected by SwiftTrade
                          escrow
                        </li>
                        <li>
                          ✅ You confirm delivery with your OTP code before the
                          merchant gets paid
                        </li>
                        <li>
                          ⚠️ SwiftTrade does not control delivery timeline,
                          method, or handling
                        </li>
                        <li>
                          ⚠️ For tracked delivery with real-time updates, choose
                          SwiftTrade Delivery
                        </li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMerchantDisclaimer(false)}
                      className="text-amber-400 hover:text-amber-600 transition-colors"
                      aria-label="Dismiss notice"
                    >
                      <span className="material-symbols-outlined text-sm">
                        close
                      </span>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMethod("PLATFORM_LOGISTICS");
                        setShowMerchantDisclaimer(true);
                      }}
                      className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      Switch to SwiftTrade Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMerchantDisclaimer(false)}
                      className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest bg-white border border-amber-300 text-amber-700 rounded hover:bg-amber-50 transition-colors"
                    >
                      Continue with Merchant Delivery
                    </button>
                  </div>
                </div>
              )}
          </div>

          {/* Payment Method Selector */}
          {showPaymentMethodSection && (
            <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-black uppercase text-slate-800 tracking-widest border-b border-slate-100 pb-3">
                Payment Method
              </h2>

              <label
                className={`flex items-start gap-4 p-4 rounded border-2 cursor-pointer transition-all ${
                  paymentMethod === "ESCROW"
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => setPaymentMethod("ESCROW")}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ESCROW"
                  checked={paymentMethod === "ESCROW"}
                  onChange={() => setPaymentMethod("ESCROW")}
                  className="mt-1 accent-primary"
                />
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                    Pay via Escrow (2% fee)
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    🔒 Your money is held securely until you confirm delivery.
                    Full buyer protection.
                  </p>
                </div>
              </label>

              {isVerifiedMerchant && (
                <label
                  className={`flex items-start gap-4 p-4 rounded border-2 cursor-pointer transition-all ${
                    paymentMethod === "DIRECT"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setPaymentMethod("DIRECT")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="DIRECT"
                    checked={paymentMethod === "DIRECT"}
                    onChange={() => setPaymentMethod("DIRECT")}
                    className="mt-1 accent-emerald-500"
                  />
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
                      Pay Direct (1% fee)
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">
                        ✅ VERIFIED MERCHANT
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Money sent to merchant immediately. Lower fee for verified
                      merchants you trust.
                    </p>
                  </div>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="bg-slate-900 text-white rounded p-6 shadow-lg sticky top-8 space-y-6">
          <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-800 pb-3 text-slate-300">
            Order Summary
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-lg font-bold uppercase">{product.name}</p>
              <p className="text-xs text-primary font-bold uppercase tracking-wider mt-1">
                {(product as any).merchantProfile?.businessName ||
                  "Verified Merchant"}
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800 text-sm font-mono">
              <div className="flex justify-between items-center text-slate-300">
                <span>Unit Price</span>
                <span className="font-bold text-white">
                  {formatMoney(priceKobo)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Quantity</span>
                <span className="font-bold text-white">x {quantity}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Subtotal</span>
                <span className="font-bold text-white">
                  {formatMoney(subtotalKobo)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-xs">
                <span>Platform Fee ({feePercentage}%)</span>
                <span>{formatMoney(platformFeeKobo)}</span>
              </div>
              {deliveryMethod === "PLATFORM_LOGISTICS" && (
                <div className="flex justify-between items-center text-indigo-300">
                  <span>SwiftTrade Delivery</span>
                  <span className="font-bold flex items-center gap-2">
                    {isQuoting ? (
                      <span className="material-symbols-outlined text-xs animate-spin">
                        sync
                      </span>
                    ) : (
                      formatMoney(activeDeliveryFeeKobo)
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-lg">
              <span className="font-bold uppercase tracking-widest text-slate-300 text-xs">
                Total
              </span>
              <span className="font-black text-emerald-400">
                {formatMoney(totalKobo)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isBelowMin || !deliveryAddress}
            className="w-full py-4 rounded text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 bg-primary hover:bg-orange-600"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">
                  sync
                </span>
                PROCESSING...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">lock</span>
                PAY {formatMoney(totalKobo)}
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-slate-500 font-medium uppercase tracking-wider">
            {paymentMethod === "DIRECT" && isVerifiedMerchant
              ? "Direct payment to verified merchant via Paystack"
              : "Payments securely processed by Paystack Escrow"}
          </p>
        </div>
      </form>
    </div>
  );
}
