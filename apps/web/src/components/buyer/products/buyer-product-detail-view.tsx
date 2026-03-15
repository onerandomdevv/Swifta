"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { productApi } from "@/lib/api/product.api";
import { getMerchantReviews } from "@/lib/api/review.api";
import { addToCart } from "@/lib/api/cart.api";
import type { Product, Review } from "@hardware-os/shared";
import { PriceType } from "@hardware-os/shared";
import { toast } from "sonner";
import { cn, formatKobo, optimizeCloudinaryUrl } from "@/lib/utils";
import { StarRating } from "@/components/ui/star-rating";

interface BuyerProductDetailViewProps {
  productId: string;
}

export function BuyerProductDetailView({ productId }: BuyerProductDetailViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [merchantProducts, setMerchantProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews' | 'shipping'>('overview');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const prod = await productApi.getProduct(productId);
        setProduct(prod);
        setQuantity(prod.minOrderQuantityConsumer || 1);

        if (prod.merchantId) {
          const [revs, mProducts] = await Promise.all([
            getMerchantReviews(prod.merchantId, 1, 10).catch(() => []),
            productApi.getPublicProductsByMerchant(prod.merchantId, 1, 6).catch(() => []),
          ]);
          setReviews(revs);
          setMerchantProducts(mProducts.filter(p => p.id !== productId));
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchAll();
  }, [productId]);

  const handleAddToCart = async (priceType: PriceType = PriceType.RETAIL) => {
    if (!product) return;
    try {
      await addToCart(product.id, quantity, priceType);
      toast.success(`${product.name} added to bag!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to add to bag");
    }
  };

  const handleQuickBuy = async () => {
     if (!product) return;
     try {
       await addToCart(product.id, quantity, PriceType.RETAIL);
       router.push('/buyer/cart');
     } catch (e: any) {
       toast.error(e.message || "Buy Now failed");
     }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary/40">progress_activity</span>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Product Details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4 flex flex-col items-center">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Product Not Found</h2>
        <button onClick={() => router.back()} className="px-6 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const retail = Number(product.retailPriceKobo || 0);
  const wholesale = Number(product.wholesalePriceKobo || 0);
  const bulkSavings = retail > 0 && wholesale > 0 ? Math.round(((retail - wholesale) / retail) * 100) : 0;
  const merchant = product.merchantProfile;

  return (
    <div className="flex flex-col gap-8 font-display -mx-4 lg:-mx-8 -mt-4 lg:-mt-8 p-4 lg:p-8 bg-background-light dark:bg-background-dark min-h-[120vh]">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <Link href="/buyer/catalogue" className="hover:text-primary transition-colors">{product.categoryTag || "Catalogue"}</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-slate-900 dark:text-white truncate max-w-[200px] font-bold">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
        {/* Gallery Section */}
        <div className="xl:col-span-7 flex flex-col md:flex-row gap-4">
          {/* Thumbnails Left */}
          <div className="order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0 no-scrollbar">
            <button className="w-16 h-16 rounded-lg border-2 border-primary bg-white dark:bg-slate-900 overflow-hidden shrink-0 shadow-sm">
               {product.imageUrl ? <img src={optimizeCloudinaryUrl(product.imageUrl, 150)} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200"><span className="material-symbols-outlined">image</span></div>}
            </button>
            <div className="w-16 h-16 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden shrink-0 opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center cursor-default">
              <span className="material-symbols-outlined text-slate-300">photo_library</span>
            </div>
          </div>
          {/* Main Image */}
          <div className="order-1 md:order-2 flex-1 relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
            {product.imageUrl ? (
              <img src={optimizeCloudinaryUrl(product.imageUrl, 800)} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <span className="material-symbols-outlined text-[80px] text-slate-200 dark:text-slate-800">inventory_2</span>
              </div>
            )}
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className={cn(
                "absolute top-5 right-5 p-2.5 bg-white shadow-md border border-slate-100 rounded-full transition-transform hover:scale-110",
                isFavorite ? "text-rose-500" : "text-slate-300"
              )}
            >
              <span className={cn("material-symbols-outlined text-xl", isFavorite && "font-variation-fill")}>favorite</span>
            </button>
          </div>
        </div>

        {/* Info Column */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div>
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full mb-3 border border-primary/20">
              {product.categoryTag || "General"}
            </span>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-3">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <StarRating rating={4} readOnly size="sm" />
                <span className="text-slate-900 dark:text-white font-bold text-sm ml-1">4.0</span>
              </div>
              <span className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold uppercase tracking-wider">({reviews.length} Verified Reviews)</span>
            </div>

            {/* Merchant Card */}
            {merchant && (
              <Link href={`/buyer/merchants/${merchant.id}`}>
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:border-primary/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 overflow-hidden">
                       {merchant.profileImage ? <img src={merchant.profileImage} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-primary/60">storefront</span>}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{merchant.businessName}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-slate-400 text-[9px] font-bold flex items-center gap-1 uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[10px] text-emerald-500 font-variation-fill">verified_user</span> 
                          Verified
                        </p>
                        <p className="text-slate-400 text-[9px] flex items-center gap-1 font-bold uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[10px] text-primary">handshake</span>
                          {merchant.dealsClosed || 0} Sales
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 border border-slate-200 text-slate-600 group-hover:bg-primary group-hover:text-white group-hover:border-primary text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all">
                    Visit
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Pricing Box */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="mb-4">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Retail Price</p>
              <div className="flex items-end gap-1">
                <p className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{formatKobo(retail)}</p>
                <p className="text-sm font-bold text-slate-300 mb-1">/ {product.unit || "unit"}</p>
              </div>
            </div>
            {wholesale > 0 && (
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-primary/10 border border-emerald-100/50 rounded-lg">
                <div>
                  <p className="text-emerald-600 text-[9px] font-bold uppercase tracking-wider mb-0.5">Wholesale ({product.minOrderQuantity}+ units)</p>
                  <div className="flex items-end gap-1">
                    <p className="text-2xl font-bold text-emerald-600 tracking-tight">{formatKobo(wholesale)}</p>
                    <p className="text-xs font-bold text-emerald-600/60 mb-1">/ {product.unit || "unit"}</p>
                  </div>
                </div>
                {bulkSavings > 0 && (
                  <span className="bg-emerald-600 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                    -{bulkSavings}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100/50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 p-1 rounded-lg w-32 justify-between h-12">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
              <button 
                onClick={handleQuickBuy}
                className="flex-1 bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900 h-12 rounded-lg font-bold hover:opacity-90 transition-all uppercase tracking-widest text-[10px]"
              >
                Quick Buy
              </button>
            </div>
            <button 
              onClick={() => handleAddToCart(PriceType.RETAIL)}
              className="w-full bg-primary text-white h-14 rounded-lg font-bold text-sm shadow-md shadow-primary/5 hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-xl">shopping_bag</span>
              Add to Bag
            </button>
            <button 
              onClick={() => {
                const phone = merchant?.contact?.phone?.replace(/\D/g, "") || "2340000000000";
                window.open(`https://wa.me/${phone}?text=Hi, I'm interested in your product: ${product.name}`, "_blank");
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[#25D366] text-lg">chat</span>
              Chat with Merchant
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <section className="mt-12 bg-white dark:bg-white/5 p-8 rounded-xl border border-slate-100 dark:border-slate-800/50">
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-8 mb-8 no-scrollbar">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "pb-4 font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === 'overview' ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent"
            )}
          >
            Overview
          </button>
          <button 
             onClick={() => setActiveTab('specs')}
             className={cn(
               "pb-4 font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap",
               activeTab === 'specs' ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent"
             )}
          >
            Specifications
          </button>
          <button 
             onClick={() => setActiveTab('reviews')}
             className={cn(
               "pb-4 font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap",
               activeTab === 'reviews' ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent"
             )}
          >
            Verified Reviews ({reviews.length})
          </button>
          <button 
             onClick={() => setActiveTab('shipping')}
             className={cn(
               "pb-4 font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap",
               activeTab === 'shipping' ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent"
             )}
          >
            Delivery Details
          </button>
        </div>

        <div className="max-w-4xl text-sm leading-relaxed min-h-[150px]">
          {activeTab === 'overview' && (
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
               <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white uppercase tracking-tight">Product Summary</h3>
               <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-3xl">
                 {product?.description || "Detailed overview coming soon for this professional-grade hardware supply."}
               </p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
               <div className="flex justify-between py-3 border-b border-slate-50 dark:border-slate-800/50">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</span>
                 <span className="font-bold text-slate-900 dark:text-white text-sm">{product?.categoryTag}</span>
               </div>
               <div className="flex justify-between py-3 border-b border-slate-50 dark:border-slate-800/50">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit</span>
                 <span className="font-bold text-slate-900 dark:text-white text-sm">{product?.unit || "N/A"}</span>
               </div>
               <div className="flex justify-between py-3 border-b border-slate-50 dark:border-slate-800/50">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wholesale Min</span>
                 <span className="font-bold text-slate-900 dark:text-white text-sm">{product?.minOrderQuantity} Units</span>
               </div>
                <div className="flex justify-between py-3 border-b border-slate-50 dark:border-slate-800/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Availability</span>
                  <span className="font-bold text-emerald-500 text-sm">Active Stock</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-50 dark:border-slate-800/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{product?.weightKg ? `${product.weightKg}kg` : "N/A"}</span>
                </div>
              </div>
          )}

          {activeTab === 'reviews' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-300">
               {reviews.length > 0 ? (
                 reviews.map((r, i) => (
                   <div key={i} className="flex gap-4">
                     <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                       <span className="material-symbols-outlined text-slate-300 text-sm">person</span>
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {r.buyerName || "Verified Buyer"}
                          </span>
                          <StarRating rating={(r as any).rating || 5} readOnly size="sm" />
                        </div>
                       <p className="text-xs text-slate-500 italic font-medium leading-relaxed">&quot;{r.comment}&quot;</p>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="py-12 text-center text-slate-300">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">rate_review</span>
                    <p className="font-bold text-[9px] uppercase tracking-widest">No verified reviews yet</p>
                 </div>
               )}
             </div>
          )}

          {activeTab === 'shipping' && (
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-300 space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">local_shipping</span>
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">Estimated Delivery</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    {product.processingDays === 0 ? "Ships same day" : `Ready for shipping in ${product.processingDays || 3} business days`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-xl">location_on</span>
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">Shipment Origin</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    {product.warehouseLocation || "Merchant Warehouse"}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[12px]">info</span>
                  Delivery Policy
                </p>
                <p className="mt-2 text-[11px] text-slate-500 leading-relaxed italic">
                  Shipping costs are calculated at checkout based on the distance between the origin and your delivery address. Merchant delivery is optimized for direct, secure transfers.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recommendations */}
      {merchantProducts.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Recommended for you</h2>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
            {merchantProducts.map((p) => (
              <Link 
                href={`/buyer/products/${p.id}`}
                key={p.id} 
                className="min-w-[280px] bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden snap-start hover:shadow-md transition-all group"
              >
                <div className="aspect-square relative overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-950 mb-4 border border-slate-100 dark:border-slate-800">
                  {p.imageUrl ? (
                    <img src={optimizeCloudinaryUrl(p.imageUrl, 400)} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200"><span className="material-symbols-outlined text-3xl">inventory_2</span></div>
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{p.categoryTag || "General"}</p>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm line-clamp-1 tracking-tight">{p.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary tracking-tight">{formatKobo(Number(p.retailPriceKobo || p.pricePerUnitKobo || 0))}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
