"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { createDirectOrder } from "@/lib/api/order.api";
import { toast } from "sonner";
import { StateLgaSelector } from "@/components/ui/state-lga-selector";
import type { Product, MerchantProfile } from "@hardware-os/shared";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  merchant: MerchantProfile;
}

export function InstantCheckoutModal({ isOpen, onClose, product, merchant }: Props) {
  // Determine available price types
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
  const [altPhone, setAltPhone] = useState("");
  const [busStop, setBusStop] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const [deliveryMethod, setDeliveryMethod] = useState<"PLATFORM_LOGISTICS" | "MERCHANT_DELIVERY">("PLATFORM_LOGISTICS");
  const [loading, setLoading] = useState(false);

  // Update quantity whenever purchase type changes
  useEffect(() => {
    if (purchaseType === "RETAIL") {
      setQuantity(Math.max(1, product.minOrderQuantityConsumer || 1));
    } else {
      setQuantity(Math.max(1, product.minOrderQuantity || 1));
    }
  }, [purchaseType, product]);

  const minQty = purchaseType === "RETAIL" ? (product.minOrderQuantityConsumer || 1) : (product.minOrderQuantity || 1);
  const unitPrice = purchaseType === "RETAIL" 
    ? Number(product.retailPriceKobo || 0) 
    : Number(product.wholesalePriceKobo || 0);
    
  const totalCost = (unitPrice * quantity) / 100;

  const handleCheckout = async () => {
    if (quantity < minQty) {
      toast.error(`Minimum order quantity for this tier is ${minQty} ${product.unit}`);
      return;
    }
    if (!deliveryState || !deliveryLga || !deliveryStreet.trim() || !primaryPhone.trim()) {
      toast.error("Please provide complete delivery details including your phone number.");
      return;
    }

    // Retain legacy string for backward compatibility
    let fullDeliveryAddress = `${deliveryStreet.trim()}, ${deliveryLga}, ${deliveryState}`;
    if (busStop.trim()) fullDeliveryAddress += ` (Nearest Bus Stop: ${busStop.trim()})`;

    // New V5 Structured JSON payload
    const deliveryDetails = {
      state: deliveryState,
      lga: deliveryLga,
      street: deliveryStreet.trim(),
      busStop: busStop.trim() || undefined,
      primaryPhone: primaryPhone.trim(),
      altPhone: altPhone.trim() || undefined,
    };

    try {
      setLoading(true);
      const res = await createDirectOrder({
        productId: product.id,
        quantity,
        deliveryAddress: fullDeliveryAddress,
        deliveryDetails,
        paymentMethod: "ESCROW",
        deliveryMethod,
      });
      
      toast.success("Order Created! Redirecting to payment...");
      if (res.authorizationUrl) {
        window.location.href = res.authorizationUrl;
      } else {
        onClose();
        window.location.href = `/buyer/orders/${res.orderId}`;
      }
    } catch (err: any) {
      toast.error(err.message || "Checkout failed.");
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Terminal Checkout" 
      className="max-w-xl bg-white dark:bg-navy-dark border-none shadow-2xl overflow-hidden"
    >
      <div className="space-y-8 pb-4">
        {/* Pricing Tier Selection - Premium Sliding Pill */}
        <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[2rem] flex gap-2 relative border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
          <button
            onClick={() => setPurchaseType("RETAIL")}
            disabled={!hasRetail}
            className={`flex-1 py-3.5 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
              purchaseType === "RETAIL" 
                ? "bg-white text-primary shadow-2xl dark:bg-slate-700 dark:text-white" 
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500"
            } ${!hasRetail && "opacity-20 cursor-not-allowed"}`}
          >
            Retail Unit
          </button>
          <button
            onClick={() => setPurchaseType("WHOLESALE")}
            disabled={!hasWholesale}
            className={`flex-1 py-3.5 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
              purchaseType === "WHOLESALE" 
                ? "bg-primary text-white shadow-2xl shadow-primary/40" 
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500"
            } ${!hasWholesale && "opacity-20 cursor-not-allowed"}`}
          >
            Wholesale Bulk
          </button>
        </div>

        {/* Product Synopsis - Glassmorphic */}
        <div className="relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 opacity-50 rounded-[2.5rem]" />
          <div className="relative flex items-center gap-6 p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[2.5rem]">
            <div className="size-20 rounded-3xl overflow-hidden bg-slate-800 shrink-0 p-3 shadow-2xl ring-4 ring-white/10">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <span className="material-symbols-outlined text-slate-300 text-3xl">inventory_2</span>
              )}
            </div>
            <div className="overflow-hidden space-y-1">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Manifest Item</p>
              <h4 className="text-xl font-black text-navy-dark dark:text-white leading-none tracking-tighter truncate">
                {product.name}
              </h4>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                {(unitPrice / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 })} <span className="text-[10px] uppercase tracking-widest opacity-60">Per {product.unit}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quantity Selection - Tactile Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <label className="text-[10px] font-black text-navy-dark dark:text-white uppercase tracking-[0.25em]">
              Quantity Required
            </label>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              Min: {minQty} {product.unit}
            </span>
          </div>
          <div className="flex bg-slate-100/50 dark:bg-slate-900/50 rounded-[2.25rem] border border-slate-200/50 dark:border-slate-800/50 items-center justify-between p-2.5">
            <button 
              onClick={() => setQuantity(Math.max(minQty, quantity - 1))}
              className="size-14 bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary/70 hover:text-primary transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-2xl font-black">remove</span>
            </button>
            <div className="flex flex-col items-center">
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(Math.max(minQty, parseInt(e.target.value) || minQty))}
                className="w-24 text-center bg-transparent font-black text-3xl text-navy-dark dark:text-white outline-none font-display h-8"
              />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{product.unit}</span>
            </div>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="size-14 bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary/70 hover:text-primary transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-2xl font-black">add</span>
            </button>
          </div>
          {quantity < minQty && (
            <div className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest px-4">
              <span className="material-symbols-outlined text-sm">warning</span>
              Compliance error: Minimum requirement is {minQty} {product.unit}
            </div>
          )}
        </div>

        {/* Address and Delivery Method block */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
             <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
               Logistics Protocol
             </label>
             <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button
              onClick={() => setDeliveryMethod("PLATFORM_LOGISTICS")}
              className={`p-4 rounded-[1.75rem] border-2 transition-all duration-500 flex flex-col items-center gap-2 group ${
                deliveryMethod === "PLATFORM_LOGISTICS" 
                  ? "border-primary bg-primary/5 text-primary shadow-xl shadow-primary/5" 
                  : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
              }`}
            >
              <div className={`size-10 rounded-2xl flex items-center justify-center transition-colors ${deliveryMethod === "PLATFORM_LOGISTICS" ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200"}`}>
                <span className="material-symbols-outlined text-xl">local_shipping</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black uppercase tracking-widest block">Swift Route</span>
                <span className="text-[9px] font-bold opacity-60">Verified Logistics</span>
              </div>
             </button>
             <button
              onClick={() => setDeliveryMethod("MERCHANT_DELIVERY")}
              className={`p-4 rounded-[1.75rem] border-2 transition-all duration-500 flex flex-col items-center gap-2 group ${
                deliveryMethod === "MERCHANT_DELIVERY" 
                  ? "border-amber-500 bg-amber-500/5 text-amber-500 shadow-xl shadow-amber-500/5" 
                  : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
              }`}
            >
              <div className={`size-10 rounded-2xl flex items-center justify-center transition-colors ${deliveryMethod === "MERCHANT_DELIVERY" ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200"}`}>
                <span className="material-symbols-outlined text-xl">storefront</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black uppercase tracking-widest block">Direct Origin</span>
                <span className="text-[9px] font-bold opacity-60">Merchant Route</span>
              </div>
             </button>
          </div>

          {deliveryMethod === "MERCHANT_DELIVERY" && (
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 p-4 rounded-3xl flex gap-4 text-amber-700 dark:text-amber-400 items-start animate-in slide-in-from-top-4 duration-500">
              <span className="material-symbols-outlined text-xl shrink-0">security</span>
              <p className="text-[11px] leading-relaxed font-bold uppercase tracking-tight opacity-80">
                You have bypassed SwiftTrade high-speed logistics. Escrow remains active for capital safety, but merchant assumes transit liability.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
               <label className="text-[10px] font-black text-navy-dark dark:text-white uppercase tracking-[0.3em]">Destiniation</label>
               <div className="h-px flex-1 bg-slate-50 dark:bg-slate-800/50" />
            </div>
            
            <StateLgaSelector 
              selectedState={deliveryState}
              selectedLga={deliveryLga}
              onStateChange={setDeliveryState}
              onLgaChange={setDeliveryLga}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-100/50 dark:bg-slate-900/50 p-1.5 pl-4 rounded-2xl border border-slate-200/40 dark:border-slate-800/50 flex items-center gap-3 group focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                <input
                  type="text"
                  value={deliveryStreet}
                  onChange={(e) => setDeliveryStreet(e.target.value)}
                  className="flex-1 bg-transparent text-[11px] font-black uppercase tracking-widest placeholder:text-slate-400 outline-none h-10"
                  placeholder="Street / Facility"
                />
              </div>

              <div className="bg-slate-100/50 dark:bg-slate-900/50 p-1.5 pl-4 rounded-2xl border border-slate-200/40 dark:border-slate-800/50 flex items-center gap-3 group focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-sm">call</span>
                <input
                  type="tel"
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value)}
                  className="flex-1 bg-transparent text-[11px] font-black uppercase tracking-widest placeholder:text-slate-400 outline-none h-10"
                  placeholder="Primary Comms"
                />
              </div>
            </div>

            {/* Optional Fields Toggle */}
            <div className="pt-2">
              <button
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                className="flex items-center gap-2 text-[10px] font-black text-primary hover:opacity-80 transition-opacity uppercase tracking-widest"
              >
                <div className="size-4 rounded-full border border-primary flex items-center justify-center">
                   <span className="material-symbols-outlined text-[10px]">
                    {showOptionalFields ? "remove" : "add"}
                  </span>
                </div>
                Extended Manifest Details
              </button>
            </div>

            {showOptionalFields && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 animate-in slide-in-from-top-4 fade-in duration-500">
                <div className="bg-slate-100/50 dark:bg-slate-900/50 p-1.5 pl-4 rounded-2xl border border-slate-200/40 dark:border-slate-800/50 flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-sm">directions_bus</span>
                  <input
                    type="text"
                    value={busStop}
                    onChange={(e) => setBusStop(e.target.value)}
                    className="w-full bg-transparent text-[11px] font-black uppercase tracking-widest placeholder:text-slate-400 outline-none h-10"
                    placeholder="Terminal / Bus Stop"
                  />
                </div>
                <div className="bg-slate-100/50 dark:bg-slate-900/50 p-1.5 pl-4 rounded-2xl border border-slate-200/40 dark:border-slate-800/50 flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-sm">phone_iphone</span>
                  <input
                    type="tel"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    className="w-full bg-transparent text-[11px] font-black uppercase tracking-widest placeholder:text-slate-400 outline-none h-10"
                    placeholder="Backup WhatsApp"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Final Settlement Block */}
        <div className="bg-navy-dark dark:bg-slate-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <span className="material-symbols-outlined text-[100px]">account_balance_wallet</span>
          </div>
          
          <div className="space-y-4 mb-8 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Unit Valuation</span>
              <span className="text-sm font-black text-white">
                {(unitPrice / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Logistics Surcharge</span>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-400/30 px-3 py-1 rounded-full">Calculated at Hub</span>
            </div>
            <div className="h-px bg-white/10 my-4" />
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] text-primary font-black uppercase tracking-[0.4em] block mb-1">Total Settlement</span>
                <span className="text-3xl font-black text-white font-display leading-none">
                  {totalCost.toLocaleString("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest border border-slate-700 px-2 py-0.5 rounded-md">V5 Industrial Standard</span>
              </div>
            </div>
          </div>

          <button 
            className="w-full h-16 bg-white dark:bg-primary text-navy-dark dark:text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-white/10 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 relative z-10 overflow-hidden group/btn"
            onClick={handleCheckout}
            disabled={loading || quantity < minQty || !deliveryState || !deliveryLga || !deliveryStreet.trim() || !primaryPhone.trim()}
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-lg group-hover/btn:translate-x-1 transition-transform">encrypted</span>
            )}
            {loading ? "Initializing Terminal..." : "Execute Settlement"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
