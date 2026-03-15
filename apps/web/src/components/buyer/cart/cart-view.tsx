"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getCart, updateCartItem, removeCartItem } from "@/lib/api/cart.api";
import { checkoutCart, getDeliveryQuote } from "@/lib/api/order.api";
import { productApi } from "@/lib/api/product.api";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";
import Link from "next/link";
import { cn, formatKobo, optimizeCloudinaryUrl } from "@/lib/utils";
import { Product } from "@hardware-os/shared";
import { StateLgaSelector } from "@/components/ui/state-lga-selector";

type PaymentMethod = "ESCROW" | "DIRECT";

interface CartViewProps {
  title?: string;
  catalogueHref?: string;
  isProcurement?: boolean;
}

export function CartView({ 
  title = "Your Cart", 
  catalogueHref = "/buyer/catalogue",
  isProcurement = false 
}: CartViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [deliveryState, setDeliveryState] = useState("");
  const [deliveryLga, setDeliveryLga] = useState("");
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ESCROW");
  const [deliveryMethod, setDeliveryMethod] = useState<
    "MERCHANT_DELIVERY" | "PLATFORM_LOGISTICS"
  >("MERCHANT_DELIVERY");
  const [deliveryQuoteKobo, setDeliveryQuoteKobo] = useState<number | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

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
    refetchOnWindowFocus: false,
  });

  // Group items by merchant
  const cartItems = React.useMemo(() => cart?.items || [], [cart?.items]);
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, { merchantName: string; merchantTier: string; merchantAddress?: string; items: any[] }> = {};
    cartItems.forEach((item) => {
      const mId = item.product.merchantId;
      if (!groups[mId]) {
        groups[mId] = {
          merchantName: item.product.merchantName || "Unknown Seller",
          merchantTier: item.product.merchantTier || "STANDARD",
          merchantAddress: item.product.merchantAddress,
          items: [],
        };
      }
      groups[mId].items.push(item);
    });
    return groups;
  }, [cartItems]);

  const merchantIds = Object.keys(groupedItems);

  // Auto-select first merchant if none selected
  useEffect(() => {
    if (!selectedMerchantId && merchantIds.length > 0) {
      setSelectedMerchantId(merchantIds[0]);
    }
  }, [merchantIds, selectedMerchantId]);

  // Derived states for SELECTED merchant
  const activeGroup = React.useMemo(() => selectedMerchantId ? groupedItems[selectedMerchantId] : null, [selectedMerchantId, groupedItems]);
  const activeItems = React.useMemo(() => activeGroup?.items || [], [activeGroup?.items]);
  const activeSubtotalKobo = React.useMemo(() => activeItems.reduce((sum, item) => sum + Number(item.itemTotalKobo), 0), [activeItems]);
  const activeMerchantTier = activeGroup?.merchantTier;
  const isVerifiedMerchant = activeMerchantTier === "VERIFIED" || activeMerchantTier === "TRUSTED";

  // Fetch Related Products
  useEffect(() => {
    async function fetchRelated() {
      try {
        const data = await productApi.getCatalogue("", "All Categories", 1, 5);
        setRelatedProducts(data);
      } catch (err) {
        console.error("Failed to load related products", err);
      }
    }
    fetchRelated();
  }, []);

  const createOrderMutation = useMutation({
    mutationFn: checkoutCart,
    onError: (err: any) => {
      const msg = err?.error || err?.message || "Checkout failed";
      setError(msg);
      toast.error(msg);
      setIsRedirecting(false);
    },
    onSuccess: (data) => {
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setError("Invalid payment URL returned");
        setIsRedirecting(false);
      }
    },
  });

  useEffect(() => {
    const fetchQuote = async () => {
      const fullAddress = `${deliveryStreet}, ${deliveryLga}, ${deliveryState}`;
      if (
        deliveryMethod !== "PLATFORM_LOGISTICS" ||
        deliveryStreet.length < 5 ||
        !deliveryState ||
        !deliveryLga ||
        activeItems.length === 0
      ) {
        setDeliveryQuoteKobo(null);
        return;
      }

      const pickupAddress = activeGroup?.merchantAddress;
      if (!pickupAddress) return;

      setIsQuoting(true);
      try {
        const estimatedWeightKg = activeItems.reduce(
          (sum, item) =>
            sum + (item.product.unit?.toLowerCase() === "bag" ? 50 : 10) * item.quantity,
          0
        );
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
  }, [deliveryMethod, deliveryStreet, deliveryLga, deliveryState, activeItems, activeGroup]);

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    if (!deliveryState || !deliveryLga) {
      toast.error("Please select a State and LGA for delivery.");
      return;
    }
    if (!deliveryStreet.trim()) {
      toast.error("Please enter a street address.");
      return;
    }
    if (!primaryPhone.trim()) {
      toast.error("Please enter a contact phone number.");
      return;
    }

    const fullAddress = `${deliveryStreet.trim()}, ${deliveryLga}, ${deliveryState}`;

    const deliveryDetails = {
      state: deliveryState,
      lga: deliveryLga,
      street: deliveryStreet.trim(),
      primaryPhone: primaryPhone.trim(),
    };

    setError(null);
    setIsRedirecting(true);
    createOrderMutation.mutate({
      cartItemIds: activeItems.map((i) => i.id),
      deliveryAddress: fullAddress,
      deliveryDetails,
      paymentMethod: isVerifiedMerchant ? paymentMethod : "ESCROW",
      deliveryMethod,
    });
  };

  const handleUpdateQuantity = async (item: any, newQuantity: number) => {
    try {
      const minQty =
        item.priceType === "WHOLESALE"
          ? item.product.minOrderQuantity
          : item.product.minOrderQuantityConsumer;

      if (newQuantity < minQty) {
        toast.error(`Min qty is ${minQty}`);
        return;
      }

      await updateCartItem(item.id, newQuantity);
      refetchCart();
    } catch (err: any) {
      toast.error(err.message || "Failed to update quantity");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeCartItem(itemId);
      toast.success("Item removed");
      refetchCart();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove item");
    }
  };

  const isSubmitting = createOrderMutation.isPending;
  const feePercentage = (isVerifiedMerchant && paymentMethod === "DIRECT") ? 0.01 : 0.02;
  const platformFeeKobo = Math.floor(activeSubtotalKobo * feePercentage);
  const deliveryFeeKobo = deliveryMethod === "PLATFORM_LOGISTICS" ? deliveryQuoteKobo || 250000 : 0;
  const totalKobo = activeSubtotalKobo + platformFeeKobo + deliveryFeeKobo;
  const isAddressComplete = !!(deliveryState && deliveryLga && deliveryStreet.trim() && primaryPhone.trim());

  if (isRedirecting) {
    return (
      <div className="bg-[#f8fafc] flex items-center justify-center min-h-[50vh] p-4">
        <main className="w-full max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative h-20 w-20 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
              <span className="material-symbols-outlined text-3xl text-emerald-600">lock</span>
            </div>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mb-3">
            Redirecting to secure payment...
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Please wait while we set up your secure transaction.
          </p>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-1/3 animate-[slide_2s_ease-in-out_infinite]" />
          </div>
          <style jsx>{`
            @keyframes slide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
          `}</style>
        </main>
      </div>
    );
  }

  if (isCartLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 mb-6">
          <span className="material-symbols-outlined text-4xl">shopping_cart</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Cart is empty</h2>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm">
          {isProcurement ? "You haven't added any supplies or stock items yet." : "Browse the catalogue to find materials for your projects."}
        </p>
        <Link
          href={catalogueHref}
          className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all inline-block text-sm"
        >
          Browse Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── LEFT: Content ── */}
        <section className="lg:w-3/4 space-y-8">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">{title}</h2>
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                {cartItems.length} {cartItems.length === 1 ? "Item" : "Items"}
              </span>
            </div>
            <p className="text-xs text-slate-500">Items are grouped by merchant to ensure accurate logistics and escrow settlement.</p>
          </div>

          <div className="space-y-10">
            {merchantIds.map((mId) => {
              const group = groupedItems[mId];
              const isSelected = selectedMerchantId === mId;

              return (
                <div 
                  key={mId}
                  onClick={() => setSelectedMerchantId(mId)}
                  className={cn(
                    "rounded-3xl border transition-all duration-300",
                    isSelected 
                      ? "bg-white border-emerald-500/20 shadow-xl shadow-emerald-900/[0.03]" 
                      : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "px-6 py-4 flex items-center justify-between border-b",
                    isSelected ? "bg-emerald-500/[0.02] border-emerald-500/10" : "border-slate-100"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-9 rounded-xl flex items-center justify-center transition-colors",
                        isSelected ? "bg-emerald-500 text-white" : "bg-white text-slate-300 border border-slate-100"
                      )}>
                        <span className="material-symbols-outlined text-lg">storefront</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Seller</p>
                        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          {group.merchantName}
                          {isSelected && (
                            <span className="bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-tighter">Active</span>
                          )}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-2 divide-y divide-slate-50">
                    {group.items.map((item) => (
                      <div key={item.id} className="py-5 flex flex-col sm:flex-row gap-5">
                        <div className="size-16 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-50">
                          {item.product.imageUrl ? (
                            <img src={optimizeCloudinaryUrl(item.product.imageUrl, 200)} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-300">inventory_2</span>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col sm:flex-row justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-slate-900">{item.product.name}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                              {formatKobo(Number(item.product.priceKobo))} / {item.product.unit || "unit"} · {item.priceType}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg">
                                <button onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item, item.quantity - 1); }} className="size-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400"><span className="material-symbols-outlined text-xs">remove</span></button>
                                <span className="text-[11px] font-black w-4 text-center">{item.quantity}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item, item.quantity + 1); }} className="size-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400"><span className="material-symbols-outlined text-xs">add</span></button>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }} className="text-[9px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-widest transition-colors">Remove</button>
                            </div>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-sm font-black text-slate-900 leading-none">{formatKobo(Number(item.itemTotalKobo))}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Delivery Details</h4>
              <StateLgaSelector selectedState={deliveryState} selectedLga={deliveryLga} onStateChange={setDeliveryState} onLgaChange={setDeliveryLga} />
              <input type="text" value={deliveryStreet} onChange={(e) => setDeliveryStreet(e.target.value)} placeholder="Full Street Address" className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
              <input type="tel" value={primaryPhone} onChange={(e) => setPrimaryPhone(e.target.value.replace(/\D/g, ""))} placeholder="Contact Phone Number" className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">Methods</h4>
                <div className="space-y-2">
                  <div onClick={() => setDeliveryMethod("MERCHANT_DELIVERY")} className={cn("flex items-center justify-between p-3 rounded-xl cursor-pointer border-2 transition-all", deliveryMethod === "MERCHANT_DELIVERY" ? "border-emerald-500 bg-emerald-50/50" : "border-slate-100 bg-white")}>
                    <span className="text-xs font-bold">Standard Delivery</span>
                    <span className="text-[10px] text-slate-400">Lagos/NG</span>
                  </div>
                  <div onClick={() => setPaymentMethod("ESCROW")} className={cn("flex items-center justify-between p-3 rounded-xl cursor-pointer border-2 transition-all", paymentMethod === "ESCROW" ? "border-emerald-500 bg-emerald-50/50" : "border-slate-100 bg-white")}>
                    <span className="text-xs font-bold">Secure Escrow</span>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded tracking-tighter">RECOMMENDED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── RIGHT: Summary ── */}
        <aside className="lg:w-1/4">
          <div className="lg:sticky lg:top-8 bg-[#0f172a] text-white p-6 rounded-[2rem] shadow-2xl">
            <h3 className="text-[9px] font-black tracking-[0.2em] text-slate-500 mb-6 uppercase">Order Review</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-xs text-slate-400">Subtotal</span>
                <span className="font-bold text-sm tracking-tight">{formatKobo(activeSubtotalKobo)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Platform Fee</span>
                <span className="text-slate-300 font-medium">{formatKobo(platformFeeKobo)}</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-[10px] font-black uppercase text-slate-500">Total</span>
                <span className="text-xl font-black text-emerald-400 tracking-tighter">{formatKobo(totalKobo)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting || !selectedMerchantId || !isAddressComplete}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all",
                !selectedMerchantId || !isAddressComplete
                  ? "bg-white/10 text-white/30 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/20"
              )}
            >
              {isSubmitting ? "Processing..." : `Checkout Now`}
            </button>
            <p className="text-[9px] text-center text-slate-500 mt-6 leading-relaxed">
              Secured by Swifta Escrow. Funds are only released after delivery.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
