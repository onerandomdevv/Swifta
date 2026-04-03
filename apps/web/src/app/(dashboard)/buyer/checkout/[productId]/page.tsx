"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { productApi } from "@/lib/api/product.api";
import { createDirectOrder, getDeliveryQuote } from "@/lib/api/order.api";
import { useAuth } from "@/providers/auth-provider";
import { Product, VerificationTier } from "@twizrr/shared";
import { cn, formatKobo } from "@/lib/utils";
import { StateLgaSelector } from "@/components/ui/state-lga-selector";

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
  const [deliveryLga, setDeliveryLga] = useState("");
  const [deliveryState, setDeliveryState] = useState("");
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ESCROW");
  const [deliveryMethod, setDeliveryMethod] = useState<
    "MERCHANT_DELIVERY" | "PLATFORM_LOGISTICS"
  >("MERCHANT_DELIVERY");
  const [deliveryQuoteKobo, setDeliveryQuoteKobo] = useState<number | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);

  const merchantTier = product?.merchantProfile?.verificationTier;
  const isVerifiedMerchant = merchantTier === VerificationTier.TIER_2 || merchantTier === VerificationTier.TIER_3;

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await productApi.getProduct(params.productId);
        if (!response.pricePerUnitKobo) {
          setError("This product is not available for direct purchase yet.");
          return;
        }
        setProduct(response);
        const initialMin = (user?.buyerType === "CONSUMER" ? response.minOrderQuantityConsumer : response.minOrderQuantity) || 1;
        setQuantity(initialMin);
      } catch (err: any) {
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [params.productId, router, user?.buyerType]);

  const minQuantity = (user?.buyerType === "CONSUMER" ? product?.minOrderQuantityConsumer : product?.minOrderQuantity) || 1;
  const isBelowMin = quantity < minQuantity;

  const createOrderMutation = useMutation({
    mutationFn: createDirectOrder,
    onError: (err: any) => {
      setError(err?.error || err?.message || "Payment initialization failed");
    },
    onSuccess: async (data) => {
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        router.push("/buyer/orders");
      }
    },
  });

  useEffect(() => {
    const fetchQuote = async () => {
      const fullAddress = `${deliveryStreet}, ${deliveryLga}, ${deliveryState}`;
      if (deliveryMethod !== "PLATFORM_LOGISTICS" || deliveryStreet.length < 5 || !deliveryState || !deliveryLga || !product) {
        setDeliveryQuoteKobo(null);
        return;
      }

      const pickupAddress = (product as any)?.merchantProfile?.businessAddress;
      if (!pickupAddress) return;

      setIsQuoting(true);
      try {
        const estimatedWeightKg = product.unit.toLowerCase() === "bag" ? 50 * quantity : 10 * quantity;
        const quote = await getDeliveryQuote(pickupAddress, fullAddress, estimatedWeightKg);
        setDeliveryQuoteKobo(Number(quote.costKobo));
      } catch (err) {
        setDeliveryQuoteKobo(null);
      } finally {
        setIsQuoting(false);
      }
    };

    const delayDebounceFn = setTimeout(() => fetchQuote(), 800);
    return () => clearTimeout(delayDebounceFn);
  }, [deliveryMethod, deliveryStreet, deliveryLga, deliveryState, quantity, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!deliveryState || !deliveryLga || !deliveryStreet.trim()) {
      setError("Please complete your delivery address.");
      return;
    }

    const fullAddress = `${deliveryStreet.trim()}, ${deliveryLga}, ${deliveryState}`;
    setError(null);
    createOrderMutation.mutate({
      productId: product.id,
      quantity,
      deliveryAddress: fullAddress,
      paymentMethod: isVerifiedMerchant ? paymentMethod : "ESCROW",
      deliveryMethod,
    });
  };

  const isSubmitting = createOrderMutation.isPending;
  const priceKobo = Number(product?.pricePerUnitKobo || 0);
  const subtotalKobo = priceKobo * quantity;
  const feePercentage = paymentMethod === "DIRECT" && isVerifiedMerchant ? 1 : 2;
  const platformFeeKobo = Math.floor(subtotalKobo * (feePercentage / 100));
  const deliveryFeeKobo = deliveryMethod === "PLATFORM_LOGISTICS" ? deliveryQuoteKobo || 250000 : 0;
  const totalKobo = subtotalKobo + platformFeeKobo + deliveryFeeKobo;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 text-center">
        <div className="size-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
           <span className="material-symbols-outlined text-4xl">inventory_2</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Unavailable</h2>
        <p className="text-slate-500 mb-8">This item is no longer available for direct purchase.</p>
        <button onClick={() => router.back()} className="text-primary font-bold flex items-center gap-2 mx-auto">
           <span className="material-symbols-outlined">arrow_back</span> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen animate-in fade-in duration-700">
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => router.back()}
          className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-xl text-slate-600">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Checkout</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Order Summary</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* Item Summary */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex items-center gap-6">
              <div className="size-24 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-slate-200">inventory_2</span>
                )}
              </div>
              <div className="flex-1">
                 <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{product.name}</h3>
                 <p className="text-xs font-semibold text-slate-500 mb-4">Merchant: <span className="text-slate-900">{(product as any).merchantProfile?.businessName || "Verified Partner"}</span></p>
                 <div className="flex items-center gap-6">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                       <button 
                         type="button"
                         onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                         className="size-7 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                         disabled={quantity <= minQuantity}
                       >
                         <span className="material-symbols-outlined text-base">remove</span>
                       </button>
                       <span className="px-4 text-[11px] font-bold font-mono">{quantity}</span>
                       <button 
                         type="button"
                         onClick={() => setQuantity(quantity + 1)}
                         className="size-7 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                       >
                         <span className="material-symbols-outlined text-base">add</span>
                       </button>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Price per unit</p>
                       <p className="text-sm font-bold text-slate-900 mt-1">{formatKobo(priceKobo)}</p>
                    </div>
                 </div>
              </div>
            </div>
          </section>

          {/* Delivery Address */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-8 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-4">Delivery & Options</h2>
            <StateLgaSelector 
               selectedState={deliveryState}
               selectedLga={deliveryLga}
               onStateChange={setDeliveryState}
               onLgaChange={setDeliveryLga}
            />
            <div className="space-y-4">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">home</span> Street Address
               </label>
               <textarea 
                 value={deliveryStreet}
                 onChange={(e) => setDeliveryStreet(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-semibold focus:border-primary outline-none transition-all placeholder:text-slate-300 min-h-[100px] resize-none"
                 placeholder="Enter full delivery address details..."
               />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <span className="material-symbols-outlined text-sm">local_shipping</span> Shipping
                </label>
                <div className="space-y-3">
                   <div className={cn(
                     "relative flex items-center justify-between p-4 h-[72px] rounded-xl border opacity-60",
                     deliveryMethod === 'PLATFORM_LOGISTICS' ? 'border-primary bg-primary/[0.02]' : 'border-slate-100'
                   )}>
                     <div className="flex items-center gap-3">
                       <span className="material-symbols-outlined text-slate-400">local_shipping</span>
                       <span className="text-xs font-bold text-slate-900">twizrr <span className="text-[8px] text-primary uppercase ml-1">Soon</span></span>
                     </div>
                     <div className="size-4 rounded-full border-2 border-slate-100"></div>
                   </div>
                   <div 
                     onClick={() => setDeliveryMethod('MERCHANT_DELIVERY')}
                     className={cn(
                       "relative flex items-center justify-between p-4 h-[72px] rounded-xl cursor-pointer border transition-all",
                       deliveryMethod === 'MERCHANT_DELIVERY' ? 'border-slate-900 bg-slate-50' : 'border-slate-100'
                     )}
                   >
                     <div className="flex items-center gap-3">
                       <span className="material-symbols-outlined text-slate-400">hail</span>
                       <span className="text-xs font-bold text-slate-900">Seller Delivery</span>
                     </div>
                     <div className={cn(
                       "size-4 rounded-full border-2 flex items-center justify-center",
                       deliveryMethod === 'MERCHANT_DELIVERY' ? 'border-primary' : 'border-slate-100'
                     )}>
                        {deliveryMethod === 'MERCHANT_DELIVERY' && <div className="size-2 rounded-full bg-primary" />}
                     </div>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <span className="material-symbols-outlined text-sm">payments</span> Payment
                </label>
                <div className="space-y-3">
                   <div 
                     onClick={() => setPaymentMethod('ESCROW')}
                     className={cn(
                       "relative flex items-center justify-between p-4 h-[72px] rounded-xl cursor-pointer border transition-all",
                       paymentMethod === 'ESCROW' ? 'border-primary bg-primary/[0.02]' : 'border-slate-100'
                     )}
                   >
                     <div className="flex items-center gap-3">
                       <span className="material-symbols-outlined text-emerald-600">verified_user</span>
                       <span className="text-xs font-bold text-slate-900">Secure Escrow</span>
                     </div>
                     <div className={cn(
                       "size-4 rounded-full border-2 flex items-center justify-center",
                       paymentMethod === 'ESCROW' ? 'border-primary' : 'border-slate-100'
                     )}>
                        {paymentMethod === 'ESCROW' && <div className="size-2 rounded-full bg-primary" />}
                     </div>
                   </div>
                   <div 
                     onClick={() => isVerifiedMerchant && setPaymentMethod('DIRECT')}
                     className={cn(
                       "relative flex items-center justify-between p-4 h-[72px] rounded-xl cursor-pointer border transition-all",
                       paymentMethod === 'DIRECT' ? 'border-slate-900 bg-slate-50' : 'border-slate-100',
                       !isVerifiedMerchant && "opacity-40 cursor-not-allowed"
                     )}
                   >
                     <div className="flex items-center gap-3">
                       <span className="material-symbols-outlined text-slate-400">send_money</span>
                       <span className="text-xs font-bold text-slate-900">Pay Direct</span>
                     </div>
                     <div className={cn(
                       "size-4 rounded-full border-2 flex items-center justify-center",
                       paymentMethod === 'DIRECT' ? 'border-primary' : 'border-slate-100'
                     )}>
                        {paymentMethod === 'DIRECT' && <div className="size-2 rounded-full bg-primary" />}
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-8">
          <div className="bg-[#0f172a] rounded-xl p-8 text-white shadow-2xl relative border border-white/5">
            <div className="space-y-8">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500 mb-6">Order Summary</h2>
                <div className="h-px bg-white/5" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest leading-tight">
                  {(product as any).merchantProfile?.businessName || "AmeenStore"}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  1 item in checkout
                </p>
              </div>

              <div className="h-px bg-white/5" />

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-slate-300">Subtotal</span>
                  <span className="font-mono text-white tracking-tighter font-bold">{formatKobo(subtotalKobo)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-slate-400">Platform Fee (2%)</span>
                  <span className="font-mono text-slate-400 tracking-tighter font-bold">{formatKobo(platformFeeKobo)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-slate-400">Shipping</span>
                  <span className="font-mono text-white tracking-tighter font-bold">{formatKobo(deliveryFeeKobo)}</span>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <div className="flex justify-between items-center py-2">
                <span className="text-xs font-bold text-white uppercase tracking-[0.25em]">Total</span>
                <span className="text-3xl font-bold text-emerald-400 font-mono tracking-tighter">{formatKobo(totalKobo)}</span>
              </div>

              <div className="space-y-6">
                <button 
                  type="submit"
                  disabled={isSubmitting || isBelowMin || !deliveryStreet.trim() || !deliveryState || !deliveryLga}
                  className="w-full py-5 rounded-xl bg-[#065f46] hover:bg-[#065f46]/90 text-white font-bold text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-xl">lock</span>
                  {isSubmitting ? "PROCESSING..." : `PAY ${formatKobo(totalKobo)}`}
                </button>

                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] leading-relaxed">
                    Payments securely processed by Paystack Escrow
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-100 rounded-xl shadow-sm">
             <span className="material-symbols-outlined text-emerald-500 text-sm">verified</span>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Safe & Secure Payment</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
