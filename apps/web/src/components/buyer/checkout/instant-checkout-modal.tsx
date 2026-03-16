"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { createDirectOrder } from "@/lib/api/order.api";
import { toast } from "sonner";
import { StateLgaSelector } from "@/components/ui/state-lga-selector";
import { cn, formatKobo, optimizeCloudinaryUrl } from "@/lib/utils";
import type { Product, MerchantProfile } from "@swifta/shared";
import { VerificationTier } from "@swifta/shared";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  merchant?: Partial<MerchantProfile>;
}

export function InstantCheckoutModal({ isOpen, onClose, product, merchant }: Props) {
  const hasRetail = !!product.retailPriceKobo;
  const hasWholesale = !!product.wholesalePriceKobo;
  
  const [purchaseType, setPurchaseType] = useState<"RETAIL" | "WHOLESALE">(
    hasRetail ? "RETAIL" : "WHOLESALE"
  );

  const [quantity, setQuantity] = useState(1);
  const [deliveryLga, setDeliveryLga] = useState("");
  const [deliveryState, setDeliveryState] = useState("");
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Paystack" | "Transfer" | "Escrow">("Escrow");
  const [deliveryMethod, setDeliveryMethod] = useState<"PLATFORM_LOGISTICS" | "MERCHANT_DELIVERY">("MERCHANT_DELIVERY");
  const [discountCode, setDiscountCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Constants
  const minQty = purchaseType === "RETAIL" ? (product.minOrderQuantityConsumer || 1) : (product.minOrderQuantity || 1);
  const unitPriceKobo = purchaseType === "RETAIL" 
    ? Number(product.retailPriceKobo || 0) 
    : Number(product.wholesalePriceKobo || 0);

  const deliveryFeeKobo = deliveryMethod === "PLATFORM_LOGISTICS" ? 250000 : 0; // ₦2,500 if platform, ₦0 if merchant
  const subtotalKobo = unitPriceKobo * quantity;
  
  const isVerifiedMerchant = merchant?.verificationTier === VerificationTier.TIER_2 || merchant?.verificationTier === VerificationTier.TIER_3;
  const isDirect = paymentMethod !== "Escrow";
  const feePercentage = (isVerifiedMerchant && isDirect) ? 0.01 : 0.02;
  const platformFeeKobo = Math.floor(subtotalKobo * feePercentage);
  const totalPayableKobo = subtotalKobo + deliveryFeeKobo + platformFeeKobo;

  const isAddressComplete = !!(deliveryState && deliveryLga && deliveryStreet.trim() && primaryPhone.trim());

  useEffect(() => {
    if (purchaseType === "RETAIL") {
      setQuantity(Math.max(1, product.minOrderQuantityConsumer || 1));
    } else {
      setQuantity(Math.max(1, product.minOrderQuantity || 1));
    }
  }, [purchaseType, product]);

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      setIsRedirecting(false);
    }
  }, [isOpen]);


  if (isRedirecting) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="">
        <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
          <div className="relative h-24 w-24 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
            <span className="material-symbols-outlined text-4xl text-emerald-600">lock</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Secure Connection</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[280px] leading-relaxed">
            Please wait while we securely connect you to Paystack for payment processing...
          </p>
          <div className="mt-10 w-48 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-1/3 animate-[slide_2s_ease-in-out_infinite]" />
          </div>
          <style jsx>{`
            @keyframes slide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
          `}</style>
        </div>
      </Modal>
    );
  }


  const handleCheckout = async () => {
    if (quantity < minQty) {
      toast.error(`Minimum order quantity for this tier is ${minQty} ${product.unit}`);
      return;
    }

    if (!deliveryState) {
      toast.error("Please select a State.");
      return;
    }
    if (!deliveryLga) {
      toast.error("Please select an LGA.");
      return;
    }
    if (!deliveryStreet.trim()) {
      toast.error("Please enter a street address.");
      return;
    }
    if (!primaryPhone.trim()) {
      toast.error("Please enter a phone number.");
      return;
    }

    const fullDeliveryAddress = `${deliveryStreet.trim()}, ${deliveryLga}, ${deliveryState}`;
    
    try {
      setLoading(true);
      const result = await createDirectOrder({
        productId: product.id,
        quantity,
        deliveryAddress: fullDeliveryAddress,
        deliveryDetails: {
          state: deliveryState,
          lga: deliveryLga,
          street: deliveryStreet.trim(),
          primaryPhone: primaryPhone.trim(),
        },
        paymentMethod: isDirect ? "DIRECT" : "ESCROW",
        deliveryMethod,
      });

      if (result.authorizationUrl) {
        setIsRedirecting(true);
        window.location.href = result.authorizationUrl;
      } else {
        toast.success("Order placed successfully!");
        window.location.href = "/buyer/orders";
      }
    } catch (err: any) {
      const msg = err?.error || err?.message || "Checkout failed.";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideHeader className="max-w-[520px] p-0 rounded-2xl">
        
        {/* Header Section */}
        <header className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
              <span className="material-symbols-outlined text-[24px]">bolt</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Instant Checkout</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Secure & fast transaction</p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          
          {/* Your Order */}
          <section>
             <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Your Order</h3>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-4">
              <div className="size-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-white flex items-center justify-center">
                 {product.imageUrl ? (
                    <img src={optimizeCloudinaryUrl(product.imageUrl, 200)} alt={product.name} className="w-full h-full object-cover" />
                 ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-300">
                      <span className="material-symbols-outlined text-2xl font-variation-light">inventory_2</span>
                      <span className="text-[7px] font-black uppercase tracking-widest">No Image</span>
                    </div>
                 )}
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0">
                       <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight truncate">{product.name}</p>
                       {merchant && (
                         <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">Sold by {merchant.businessName}</p>
                       )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white shrink-0">{formatKobo(subtotalKobo)}</p>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden w-fit">
                       <button onClick={() => setQuantity(Math.max(minQty, quantity - 1))} className="size-7 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-slate-500 transition-colors">-</button>
                       <span className="px-3 py-1 text-[10px] font-bold font-mono">{quantity}</span>
                       <button onClick={() => setQuantity(quantity + 1)} className="size-7 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 border-l border-slate-200 dark:border-slate-700 text-slate-500 transition-colors">+</button>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{formatKobo(unitPriceKobo)} / {product.unit}</p>
                 </div>
              </div>
            </div>
          </section>

          {/* Delivery Address */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Delivery Address</h3>
            </div>
            
            <div className="space-y-4">
               <StateLgaSelector 
                  selectedState={deliveryState}
                  selectedLga={deliveryLga}
                  onStateChange={setDeliveryState}
                  onLgaChange={setDeliveryLga}
                />
                <input
                  type="text"
                  value={deliveryStreet}
                  onChange={(e) => setDeliveryStreet(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Street address for delivery"
                />
                <input
                  type="tel"
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Contact phone number"
                />

                {/* Full Address Preview */}
                {isAddressComplete && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-lg mt-0.5">check_circle</span>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Delivering To</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                        {deliveryStreet.trim()},<br />
                        {deliveryLga}, {deliveryState}<br />
                        Phone: {primaryPhone.trim()}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </section>

          {/* Shipping Method Selection */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Shipping Method</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <label 
                className={cn(
                  "relative flex items-center justify-between p-4 h-[84px] rounded-xl cursor-not-allowed border transition-all",
                  deliveryMethod === 'PLATFORM_LOGISTICS' ? 'border-primary bg-primary/[0.02] ring-1 ring-primary' : 'border-slate-200 dark:border-slate-700 opacity-60'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-400">local_shipping</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-slate-900 dark:text-white">Swifta</span>
                       <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-[8px] font-black text-emerald-700 uppercase tracking-tighter">Best</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] mt-1 block">Coming Soon</span>
                  </div>
                </div>
                <div className="size-5 rounded-full border-2 border-slate-200"></div>
              </label>

              <label 
                onClick={() => setDeliveryMethod('MERCHANT_DELIVERY')}
                className={cn(
                  "relative flex items-center justify-between p-4 h-[84px] rounded-xl cursor-pointer border transition-all",
                  deliveryMethod === 'MERCHANT_DELIVERY' ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-900 dark:ring-white' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-400">hail</span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Seller Shipping</span>
                    <p className="text-[10px] font-semibold text-slate-500 mt-1">Merchant handles delivery</p>
                  </div>
                </div>
                <div className={cn(
                  "size-5 rounded-full border-2 transition-all flex items-center justify-center",
                  deliveryMethod === 'MERCHANT_DELIVERY' ? 'border-primary' : 'border-slate-200'
                )}>
                  {deliveryMethod === 'MERCHANT_DELIVERY' && <div className="size-2.5 rounded-full bg-primary" />}
                </div>
              </label>
            </div>
          </section>

          {/* Payment Method Selection */}
          <section>
            <h3 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-3">Payment Method</h3>
            <div className="grid grid-cols-1 gap-3">
              
              <label 
                onClick={() => setPaymentMethod('Escrow')}
                className={cn(
                  "relative flex items-center justify-between p-4 h-[84px] rounded-xl cursor-pointer border transition-all",
                  paymentMethod === 'Escrow' ? 'border-primary bg-primary/[0.02] ring-1 ring-primary' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-600">verified_user</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-slate-900 dark:text-white">Secure Escrow</span>
                       <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-[8px] font-black text-emerald-700 uppercase tracking-tighter">Best</span>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-500 mt-1">Funds held safely until confirmed</p>
                  </div>
                </div>
                <div className={cn(
                  "size-5 rounded-full border-2 transition-all flex items-center justify-center",
                  paymentMethod === 'Escrow' ? 'border-primary' : 'border-slate-200'
                )}>
                   {paymentMethod === 'Escrow' && <div className="size-2.5 rounded-full bg-primary" />}
                </div>
              </label>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Pay Direct</span>
                </div>
                <div className="p-1 space-y-1">
                  <label 
                    onClick={() => setPaymentMethod('Paystack')}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-800",
                      paymentMethod === 'Paystack' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("material-symbols-outlined text-xl", paymentMethod === 'Paystack' ? 'text-primary' : 'text-slate-400')}>credit_card</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Card / Paystack</span>
                    </div>
                    {paymentMethod === 'Paystack' && <span className="material-symbols-outlined text-primary text-lg">check_circle</span>}
                  </label>

                  <label 
                    onClick={() => setPaymentMethod('Transfer')}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-800",
                      paymentMethod === 'Transfer' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("material-symbols-outlined text-xl", paymentMethod === 'Transfer' ? 'text-primary' : 'text-slate-400')}>account_balance</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bank Transfer</span>
                    </div>
                    {paymentMethod === 'Transfer' && <span className="material-symbols-outlined text-primary text-lg">check_circle</span>}
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Discount Code */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">sell</span>
              <input 
                 type="text" 
                 value={discountCode}
                 onChange={(e) => setDiscountCode(e.target.value)}
                 className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white" 
                 placeholder="Discount Code" 
              />
            </div>
            <button className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">Apply</button>
          </div>

          {/* Summary */}
          <div className="bg-[#0f172a] rounded-xl p-8 text-white shadow-2xl relative border border-white/5">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500 mb-6">Order Summary</h2>
                    <div className="h-px bg-white/5" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest leading-tight">
                      {merchant?.businessName || product.merchantProfile?.businessName || "AmeenStore"}
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
                      <span className="text-slate-400">Platform Fee ({feePercentage * 100}%)</span>
                      <span className="font-mono text-slate-400 tracking-tighter font-bold">{formatKobo(platformFeeKobo)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                      <div className="flex items-center gap-2 text-slate-400">
                        <span>Shipping</span>
                      </div>
                      <span className="font-mono text-white tracking-tighter font-bold">{formatKobo(deliveryFeeKobo)}</span>
                    </div>
                  </div>

                  <div className="h-px bg-white/5" />

                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-bold text-white uppercase tracking-[0.25em]">Total</span>
                    <span className="text-3xl font-bold text-emerald-400 font-mono tracking-tighter">{formatKobo(totalPayableKobo)}</span>
                  </div>

                  <div className="space-y-6">
                    <button 
                      onClick={handleCheckout}
                      disabled={loading || !isAddressComplete}
                      className={cn(
                        "w-full py-5 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]",
                        !isAddressComplete 
                           ? "bg-[#065f46] opacity-50 cursor-not-allowed text-white"
                           : "bg-[#065f46] hover:bg-[#065f46]/90 text-white disabled:opacity-50"
                      )}
                    >
                      <span className="material-symbols-outlined text-xl">lock</span>
                      {loading 
                        ? "PROCESSING..." 
                        : !isAddressComplete
                          ? "FILL DELIVERY ADDRESS"
                          : `PAY ${formatKobo(totalPayableKobo)}`}
                    </button>

                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] leading-relaxed">
                        Payments securely processed by Paystack Escrow
                      </p>
                    </div>
                  </div>
                </div>
              </div>

          {/* Action Button */}
          <div className="space-y-4">
            
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] leading-relaxed">
                Payments securely processed by Paystack Escrow
              </p>
            </div>

            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 leading-relaxed px-4 pt-2">
                By clicking "Pay", you agree to Swifta's <a href="#" className="underline hover:text-primary">Terms</a> and <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
            </p>
          </div>
        
        </div>
      </Modal>
  );
}

