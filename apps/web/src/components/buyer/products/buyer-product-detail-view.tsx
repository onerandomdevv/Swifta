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
import { cn, formatKobo } from "@/lib/utils";
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
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Premium Experience...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4 flex flex-col items-center">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Product Not Found</h2>
        <button onClick={() => router.back()} className="px-6 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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
      <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
        <Link href="/buyer/dashboard" className="hover:text-primary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <Link href="/buyer/catalogue" className="hover:text-primary transition-colors">{product.categoryTag || "Catalogue"}</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-slate-900 dark:text-white truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
        {/* Gallery Section */}
        <div className="xl:col-span-7 flex flex-col md:flex-row gap-4">
          {/* Thumbnails Left */}
          <div className="order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0 no-scrollbar">
            <button className="w-20 h-20 rounded-xl border-2 border-primary bg-white dark:bg-slate-900 overflow-hidden shrink-0 shadow-sm">
               {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><span className="material-symbols-outlined">image</span></div>}
            </button>
            <div className="w-20 h-20 rounded-xl border-2 border-transparent bg-slate-50 dark:bg-slate-900 overflow-hidden shrink-0 opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center cursor-default">
              <span className="material-symbols-outlined text-slate-400">photo_library</span>
            </div>
          </div>
          {/* Main Image */}
          <div className="order-1 md:order-2 flex-1 relative aspect-square rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <span className="material-symbols-outlined text-[100px] text-slate-200 dark:text-slate-800">inventory_2</span>
              </div>
            )}
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className={cn(
                "absolute top-6 right-6 p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full shadow-lg transition-transform hover:scale-110",
                isFavorite ? "text-rose-500" : "text-slate-400"
              )}
            >
              <span className={cn("material-symbols-outlined", isFavorite && "font-variation-fill")}>favorite</span>
            </button>
          </div>
        </div>

        {/* Info Column */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div>
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full mb-3 border border-primary/20">
              {product.categoryTag || "Industrial"}
            </span>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight mb-3">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <StarRating rating={4} readOnly size="sm" />
                <span className="text-slate-900 dark:text-white font-bold text-sm ml-1">4.0</span>
              </div>
              <span className="text-slate-400 dark:text-slate-500 text-sm">({reviews.length} Reviews)</span>
            </div>

            {/* Merchant Card */}
            {merchant && (
              <Link href={`/buyer/merchants/${merchant.id}`}>
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                       {merchant.profileImage ? <img src={merchant.profileImage} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-primary">storefront</span>}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white leading-none">{merchant.businessName}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-slate-500 text-[10px] flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-primary font-variation-fill">verified_user</span> 
                          Verified
                        </p>
                        <p className="text-slate-500 text-[10px] flex items-center gap-1 font-bold">
                          <span className="material-symbols-outlined text-xs text-primary">handshake</span>
                          {merchant.dealsClosed || 0} Deals
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className="px-4 py-2 border border-primary text-primary text-xs font-bold rounded-xl hover:bg-primary/5 transition-colors">
                    View Store
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Pricing Box */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none">
            <div className="mb-4">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">Retail Price</p>
              <div className="flex items-end gap-1">
                <p className="text-4xl font-black text-slate-900 dark:text-white">{formatKobo(retail)}</p>
                <p className="text-sm font-bold text-slate-400 mb-1">/ {product.unit || "unit"}</p>
              </div>
            </div>
            {wholesale > 0 && (
              <div className="flex items-center justify-between p-4 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl">
                <div>
                  <p className="text-primary text-xs font-bold uppercase">Wholesale Price ({product.minOrderQuantity}+ units)</p>
                  <div className="flex items-end gap-1">
                    <p className="text-2xl font-black text-primary">{formatKobo(wholesale)}</p>
                    <p className="text-xs font-bold text-primary/60 mb-1">/ {product.unit || "unit"}</p>
                  </div>
                </div>
                {bulkSavings > 0 && (
                  <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
                    Save {bulkSavings}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-32 justify-between h-14">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <span className="font-bold text-slate-900 dark:text-white">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
              <button 
                onClick={handleQuickBuy}
                className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white py-4 h-14 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors uppercase tracking-widest text-xs"
              >
                Quick Buy
              </button>
            </div>
            <button 
              onClick={() => handleAddToCart(PriceType.RETAIL)}
              className="w-full bg-primary text-white py-5 rounded-xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] transition-transform flex items-center justify-center gap-3 active:scale-95"
            >
              <span className="material-symbols-outlined">shopping_bag</span>
              Add to Bag
            </button>
            <button 
              onClick={() => {
                const phone = merchant?.contact?.phone?.replace(/\D/g, "") || "2340000000000";
                window.open(`https://wa.me/${phone}?text=Hi, I'm interested in your product: ${product.name}`, "_blank");
              }}
              className="w-full flex items-center justify-center gap-3 py-4 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
            >
              <span className="material-symbols-outlined text-[#25D366] group-hover:scale-125 transition-transform">chat</span>
              Chat with Merchant via WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <section className="mt-12 backdrop-blur-sm bg-white/30 dark:bg-white/5 p-8 rounded-[2.5rem] border border-white/20 dark:border-slate-800/50 shadow-sm">
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
        </div>

        <div className="max-w-4xl text-sm leading-relaxed min-h-[150px]">
          {activeTab === 'overview' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
               <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Product Summary</h3>
               <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                 {product?.description || "Detailed overview coming soon for this premium hardware supply."}
               </p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</span>
                 <span className="font-bold text-slate-900 dark:text-white">{product?.categoryTag}</span>
               </div>
               <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</span>
                 <span className="font-bold text-slate-900 dark:text-white">{product?.unit || "N/A"}</span>
               </div>
               <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min. Wholesale</span>
                 <span className="font-bold text-slate-900 dark:text-white">{product?.minOrderQuantity} Units</span>
               </div>
               <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/50">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Availability</span>
                 <span className="font-bold text-emerald-500">In Stock</span>
               </div>
            </div>
          )}

          {activeTab === 'reviews' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               {reviews.length > 0 ? (
                 reviews.map((r, i) => (
                   <div key={i} className="flex gap-4">
                     <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                       <span className="material-symbols-outlined text-slate-400">person</span>
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {r.buyerName || "Verified Buyer"}
                          </span>
                          <StarRating rating={(r as any).rating || 5} readOnly size="sm" />
                        </div>
                       <p className="text-xs text-slate-500 italic">&quot;{r.comment}&quot;</p>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">rate_review</span>
                    <p className="font-bold text-[10px] uppercase tracking-widest">No verified reviews yet</p>
                 </div>
               )}
             </div>
          )}
        </div>
      </section>

      {/* Recommendations */}
      {merchantProducts.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">You may also like</h2>
              <div className="h-1 w-20 bg-primary mt-2 rounded-full"></div>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
            {merchantProducts.map((p) => (
              <Link 
                href={`/buyer/products/${p.id}`}
                key={p.id} 
                className="min-w-[280px] bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden snap-start hover:shadow-xl transition-all hover:-translate-y-2 group"
              >
                <div className="aspect-square relative overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-950 mb-4">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200"><span className="material-symbols-outlined text-4xl">inventory_2</span></div>
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{p.categoryTag || "Industrial"}</p>
                  <h3 className="font-black text-slate-900 dark:text-white mb-3 text-sm line-clamp-1 uppercase tracking-tight">{p.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-primary">{formatKobo(Number(p.retailPriceKobo || p.pricePerUnitKobo || 0))}</span>
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
