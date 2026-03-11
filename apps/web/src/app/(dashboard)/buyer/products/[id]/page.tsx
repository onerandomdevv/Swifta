"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProduct, getPublicProductsByMerchant } from "@/lib/api/product.api";
import { getMerchantReviews } from "@/lib/api/review.api";
import { addToCart } from "@/lib/api/cart.api";
import type { Product, Review, PriceType } from "@hardware-os/shared";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { StarRating } from "@/components/ui/star-rating";
import { toast } from "sonner";
import { InstantCheckoutModal } from "@/components/buyer/checkout/instant-checkout-modal";

export default function PremiumProductDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [merchantProducts, setMerchantProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"specs" | "reviews" | "shipping">("specs");
  
  // Instant checkout state
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const prod = await getProduct(id as string);
        if (active) setProduct(prod);

        if (prod.merchantId) {
          const [revs, mProducts] = await Promise.all([
            getMerchantReviews(prod.merchantId, 1, 10).catch(() => []),
            getPublicProductsByMerchant(prod.merchantId, 1, 6).catch(() => []),
          ]);
          if (active) {
            setReviews(revs as unknown as Review[]);
            // Filter out current product
            setMerchantProducts((mProducts as unknown as Product[]).filter((p) => p.id !== id));
          }
        }
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load product details.");
      } finally {
        if (active) setLoading(false);
      }
    };

    if (id) fetchAll();
    return () => {
      active = false;
    };
  }, [id]);

  const handleAddToCart = async (priceType: "RETAIL" | "WHOLESALE") => {
    if (!product) return;
    const minQty = priceType === "RETAIL" ? product.minOrderQuantityConsumer : product.minOrderQuantity;
    try {
      await addToCart(product.id, minQty, priceType as PriceType);
      toast.success(`${product.name} added to cart!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to add to cart");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Loading Product Experience...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-20 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-red-500">error</span>
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-slate-500">{error || "This item may have been removed."}</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  const merchant = product.merchantProfile;
  const isVerified = merchant?.verificationTier === "VERIFIED" || merchant?.verificationTier === "TRUSTED";

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900 pb-28 animate-in fade-in duration-500">
      {/* 1. Hero Image "Carousel" (Mocked as single image for now) */}
      <div className="w-full h-72 sm:h-96 md:h-[500px] bg-slate-200 dark:bg-slate-800 relative">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[100px] text-slate-300 dark:text-slate-600">
              inventory_2
            </span>
          </div>
        )}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest border border-white/10">
          {product.categoryTag}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-6">
        {/* 2. Header Info & Pricing */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50 space-y-6">
          <h1 className="text-2xl sm:text-3xl font-black text-navy-dark dark:text-white uppercase tracking-tight leading-tight">
            {product.name}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.retailPriceKobo && (
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Retail Price
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {(Number(product.retailPriceKobo) / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 })}
                  <span className="text-sm text-slate-500 font-bold ml-1">/{product.unit}</span>
                </p>
                <p className="text-xs font-bold text-slate-500 mt-1">Min Order: {product.minOrderQuantityConsumer} {product.unit}</p>
              </div>
            )}
            
            {product.wholesalePriceKobo && (
              <div className="bg-primary/5 dark:bg-primary-dark/10 p-4 rounded-2xl border border-primary/20">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                  Wholesale Price
                </p>
                <p className="text-2xl font-black text-primary uppercase">
                  {(Number(product.wholesalePriceKobo) / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 })}
                  <span className="text-sm opacity-80 font-bold ml-1">/{product.unit}</span>
                </p>
                <p className="text-xs font-bold text-primary/80 mt-1">Min Order: {product.minOrderQuantity} {product.unit}</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Sticky Merchant Card */}
        {merchant && (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-700 sticky top-4 z-10 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className={`overflow-hidden border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 ${isVerified ? 'rounded-xl size-14 sm:size-16' : 'rounded-full size-14 sm:size-16'}`}>
                {(merchant as any).profileImage ? (
                  <img src={(merchant as any).profileImage} alt={merchant.businessName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-400 text-2xl sm:text-3xl">storefront</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-navy-dark dark:text-white uppercase truncate max-w-[150px] sm:max-w-xs block">
                    {merchant.businessName}
                  </h3>
                  {isVerified && (
                    <span className="material-symbols-outlined text-blue-500 text-lg sm:text-xl filled" title="Verified Business">
                      verified
                    </span>
                  )}
                </div>
                {(merchant.averageRating ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={merchant.averageRating ?? 0} readOnly size="sm" />
                    <span className="text-[10px] font-black text-slate-500 tracking-wider">({merchant.reviewCount})</span>
                  </div>
                )}
              </div>
            </div>
            <Link href={`/buyer/merchants/${merchant.id}`}>
              <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest h-10 px-4 rounded-xl active:scale-95">
                View Store
              </Button>
            </Link>
          </div>
        )}

        {/* 4. Merchant Highlight Offer Banner */}
        <div className="mt-6 bg-gradient-to-r from-amber-100 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/10 rounded-2xl p-4 border border-amber-200 dark:border-amber-700/50 flex items-start gap-4">
          <div className="bg-amber-400 text-white rounded-full size-8 flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
            <span className="material-symbols-outlined text-[18px]">campaign</span>
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-400 mb-1">
              Merchant Offer
            </h4>
            <p className="text-sm font-bold text-navy-dark dark:text-slate-300 leading-snug">
              Negotiated bulk prices available. Chat with merchant for loads exceeding 500 units.
            </p>
          </div>
        </div>

        {/* 5. Detail Tabs */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex border-b border-slate-100 dark:border-slate-700">
            {[ "specs", "reviews", "shipping" ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-colors ${
                  activeTab === tab 
                    ? "text-primary border-b-2 border-primary bg-primary/5" 
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
              >
                {tab === "reviews" ? `Reviews (${reviews.length})` : tab}
              </button>
            ))}
          </div>
          
          <div className="p-6">
            {activeTab === "specs" && (
              <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {product.description || "No specific details provided for this product."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700 max-w-xl">
                  {/* Mocked parsed attributes until DB attributes are fully populated */}
                  <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Unit</span>
                    <span className="text-sm font-bold text-navy-dark dark:text-white capitalize">{product.unit || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Origin</span>
                    <span className="text-sm font-bold text-navy-dark dark:text-white">Nigeria</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No verified reviews yet.</p>
                  </div>
                ) : (
                  reviews.map((r, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <StarRating rating={r.rating} readOnly size="sm" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{r.comment}"</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-slate-400">local_shipping</span>
                  <div>
                    <h5 className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-widest mb-1">Standard Delivery</h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Estimated 2-3 business days within the same region.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-slate-400">verified_user</span>
                  <div>
                    <h5 className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-widest mb-1">Buyer Protection</h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Payment secured in Escrow. Merchant paid only after you confirm delivery with OTP.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. Infinite Scroll Cross-Sell */}
        {merchantProducts.length > 0 && (
          <div className="mt-12 space-y-6">
            <h2 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
              More from {merchant?.businessName}
            </h2>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-2 -mx-2 hide-scrollbar">
              {merchantProducts.map((p) => (
                <Link 
                  href={`/buyer/products/${p.id}`} 
                  key={p.id}
                  className="snap-start shrink-0 w-48 sm:w-56 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:border-primary transition-colors group"
                >
                  <div className="h-32 bg-slate-100 dark:bg-slate-900 relative">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-slate-300">inventory_2</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2 relative">
                    <h3 className="text-[11px] font-black text-navy-dark dark:text-white uppercase truncate block">
                      {p.name}
                    </h3>
                    <p className="text-sm font-black text-primary">
                      {((Number(p.retailPriceKobo || p.wholesalePriceKobo || p.pricePerUnitKobo)) / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 7. Sticky Bottom Box */}
      {isCheckoutOpen && merchant && (
        <InstantCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setCheckoutOpen(false)}
          product={{
            ...product,
            minOrderQuantityConsumer: product.minOrderQuantityConsumer || 1,
            minOrderQuantity: product.minOrderQuantity || 50,
          }}
          merchant={merchant as any}
        />
      )}

      {/* Absolute Bottom Action Bar Fixed to screen */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 sm:px-8 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {/* Chat Icon */}
          <button 
            onClick={() => {
               // Temporary alert until chat module is fully wired or WhatsApp is used
               alert("Opening chat module...");
            }}
            className="flex items-center justify-center shrink-0 size-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-primary active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-2xl">chat_bubble</span>
          </button>
          
          <button 
            onClick={() => handleAddToCart(product.retailPriceKobo ? "RETAIL" : "WHOLESALE")}
            className="flex-1 max-w-[140px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-navy-dark dark:text-white font-black text-[10px] sm:text-xs uppercase tracking-widest h-14 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
            <span className="hidden sm:inline">Add to</span> Cart
          </button>

          <button 
            onClick={() => setCheckoutOpen(true)}
            className="flex-[2] bg-primary hover:bg-orange-600 text-white font-black text-[11px] sm:text-sm uppercase tracking-widest h-14 rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            Instant Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
