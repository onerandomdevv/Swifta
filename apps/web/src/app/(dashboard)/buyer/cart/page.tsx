"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getCart, updateCartItem, removeCartItem } from "@/lib/api/cart.api";
import { checkoutCart, getDeliveryQuote } from "@/lib/api/order.api";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";
import Link from "next/link";

type PaymentMethod = "ESCROW" | "DIRECT";

export default function BuyerCartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

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

  // Fetch Cart
  const {
    data: cart,
    isLoading: isCartLoading,
    refetch: refetchCart,
  } = useQuery({
    queryKey: ["buyer", "cart"],
    queryFn: async () => {
      const data = await getCart();
      return data;
    },
    // Don't refetch automatically during checkout config
    refetchOnWindowFocus: false,
  });

  // Since cart checkout is restricted to one merchant per order on backend:
  // Technically we already enforce this when adding to cart.
  const merchantProfile = cart?.items?.[0]?.product?.merchantProfile as any;
  const merchantTier = merchantProfile?.verificationTier;
  const isVerifiedMerchant =
    merchantTier === "VERIFIED" || merchantTier === "TRUSTED";
  const showPaymentMethodSection = isVerifiedMerchant;

  // Render variables
  const cartItems = cart?.items || [];
  const subtotalKobo = cartItems.reduce(
    (sum, item) => sum + Number(item.priceAtAddedKobo) * item.quantity,
    0,
  );

  const createOrderMutation = useMutation({
    mutationFn: checkoutCart,
    onError: (err: any) => {
      setError(err?.message || "Checkout failed");
    },
    onSuccess: async (data) => {
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setError("Invalid payment URL returned");
      }
    },
  });

  // Calculate delivery fee quote
  useEffect(() => {
    const fetchQuote = async () => {
      if (
        deliveryMethod !== "PLATFORM_LOGISTICS" ||
        deliveryAddress.length < 5 ||
        cartItems.length === 0
      ) {
        setDeliveryQuoteKobo(null);
        return;
      }

      const pickupAddress = merchantProfile?.businessAddress;
      if (!pickupAddress) return;

      setIsQuoting(true);
      try {
        // Very basic estimate calculation, assuming standard weight
        const estimatedWeightKg = cartItems.reduce(
          (sum, item) =>
            sum +
            (item.product.unit.toLowerCase() === "bag" ? 50 : 10) *
              item.quantity,
          0,
        );
        const quote = await getDeliveryQuote(
          pickupAddress,
          deliveryAddress,
          estimatedWeightKg,
        );
        setDeliveryQuoteKobo(Number(quote.costKobo));
      } catch (err) {
        setDeliveryQuoteKobo(null);
      } finally {
        setIsQuoting(false);
      }
    };

    const delayDebounceFn = setTimeout(() => fetchQuote(), 800);
    return () => clearTimeout(delayDebounceFn);
  }, [
    deliveryMethod,
    deliveryAddress,
    cartItems,
    merchantProfile?.businessAddress,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setError(null);
    createOrderMutation.mutate({
      deliveryAddress,
      paymentMethod: isVerifiedMerchant ? paymentMethod : "ESCROW",
      deliveryMethod,
    });
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      await updateCartItem(itemId, newQuantity);
      refetchCart();
    } catch (err: any) {
      toast.error(err.message || "Failed to update quantity");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeCartItem(itemId);
      toast.success("Item removed from cart");
      refetchCart();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove item");
    }
  };

  const isSubmitting = createOrderMutation.isPending;

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

  if (isCartLoading) {
    return (
      <div className="space-y-8 py-4 animate-in fade-in duration-500 max-w-5xl mx-auto">
        <Skeleton className="size-10 rounded" />
        <Skeleton className="h-10 w-64 rounded-sm" />
        <div className="bg-white border border-slate-200 rounded p-10 space-y-8">
          <Skeleton className="h-48 w-full rounded-sm" />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <div className="size-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
          <span className="material-symbols-outlined text-5xl">
            shopping_cart
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            Your Cart is Empty
          </h2>
          <p className="text-slate-500 font-bold mt-2">
            Looks like you haven't added anything to your cart yet.
          </p>
        </div>
        <Link
          href="/buyer/catalogue"
          className="inline-block bg-primary text-white font-black uppercase text-xs tracking-widest px-8 py-3 rounded hover:bg-orange-600 transition-colors"
        >
          Browse Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="size-10 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div className="space-y-0.5">
          <h1 className="text-[28px] font-bold uppercase tracking-tight leading-tight">
            Checkout Cart
          </h1>
          <p className="text-primary text-xs font-bold tracking-widest uppercase items-center flex gap-1">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            SECURE CHECKOUT
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
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
      >
        <div className="lg:col-span-2 space-y-6">
          {/* Cart Items List */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <h2 className="text-sm font-black uppercase text-slate-800 tracking-widest p-6 border-b border-slate-100 bg-slate-50/50">
              Cart Items ({cartItems.length})
            </h2>
            <div className="divide-y divide-slate-100">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-6 flex flex-col sm:flex-row gap-6"
                >
                  {/* Image */}
                  <div className="size-24 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined text-4xl">
                          inventory_2
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <Link
                        href={`/buyer/catalogue`}
                        className="text-sm font-black uppercase tracking-tight hover:text-primary transition-colors text-slate-900"
                      >
                        {item.product.name}
                      </Link>
                      <p className="font-mono font-bold text-slate-900">
                        {formatMoney(
                          Number(item.priceAtAddedKobo) * item.quantity,
                        )}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 font-bold">
                      {formatMoney(Number(item.priceAtAddedKobo))} per{" "}
                      {item.product.unit}
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="px-3 py-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 font-mono text-sm font-bold bg-white border-x border-slate-300">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity + 1)
                          }
                          className="px-3 py-1 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 tracking-wider flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          delete
                        </span>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                      </ul>
                    </div>
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
              <p className="text-xs text-primary font-bold uppercase tracking-wider mt-1">
                {merchantProfile?.businessName || "Verified Merchant"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {cartItems.length} item{cartItems.length !== 1 && "s"} in cart
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800 text-sm font-mono">
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
                <div className="flex justify-between items-center text-indigo-300 mt-2">
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
            disabled={isSubmitting || !deliveryAddress}
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
