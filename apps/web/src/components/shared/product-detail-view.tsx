"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { productApi } from "@/lib/api/product.api";
import { getMerchantReviews } from "@/lib/api/review.api";
import { addToCart } from "@/lib/api/cart.api";
import type { Product, Review } from "@swifta/shared";
import { PriceType } from "@swifta/shared";
import { toast } from "sonner";
import { cn, formatKobo, optimizeCloudinaryUrl } from "@/lib/utils";
import { StarRating } from "@/components/ui/star-rating";
import { useAuth } from "@/providers/auth-provider";

interface ProductDetailViewProps {
  productId: string;
  isOwner?: boolean;
}

export function ProductDetailView({ productId, isOwner: initialIsOwner }: ProductDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  
  const effectiveIsOwner = initialIsOwner !== undefined 
    ? initialIsOwner 
    : (!!user?.merchantId && !!product?.merchantId && user.merchantId === product.merchantId);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [merchantProducts, setMerchantProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews' | 'shipping'>('overview');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);

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
            effectiveIsOwner 
              ? Promise.resolve([]) // Don't need recommendations for owner
              : productApi.getPublicProductsByMerchant(prod.merchantId, 1, 6).catch(() => []),
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
  }, [productId, effectiveIsOwner]);

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

  const handleCopySKU = () => {
    if (product?.productCode) {
      navigator.clipboard.writeText(product.productCode);
      setCopiedSku(true);
      toast.success("SKU copied to clipboard");
      setTimeout(() => setCopiedSku(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;

    try {
      await productApi.deleteProduct(product.id);
      toast.success("Product deleted successfully");
      router.push("/merchant/products");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  const handleToggleActive = async () => {
      if (!product) return;
      try {
          // Assuming updateProduct exists and handles isActive
          await productApi.updateProduct(product.id, { isActive: !product.isActive });
          setProduct({ ...product, isActive: !product.isActive });
          toast.success(`Product ${!product.isActive ? "activated" : "deactivated"}`);
      } catch (err: any) {
          toast.error(err.message || "Operation failed");
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

  const retail = Number(product.retailPriceKobo || product.pricePerUnitKobo || 0);
  const wholesale = Number(product.wholesalePriceKobo || 0);
  const bulkSavings = retail > 0 && wholesale > 0 ? Math.round(((retail - wholesale) / retail) * 100) : 0;
  const merchant = product.merchantProfile;
  const stock = product.stockCache?.stock ?? 0;
  const isLowStock = stock <= 10 && stock > 0;

  return (
    <div className={cn(
        "flex flex-col gap-8 font-display min-h-[120vh]",
        effectiveIsOwner ? "p-8 bg-[#f8f6f6] dark:bg-[#221610]" : "-mx-4 lg:-mx-8 -mt-4 lg:-mt-8 p-4 lg:p-8 pb-32 lg:pb-8 bg-background-light dark:bg-background-dark"
    )}>
      {/* Header / Breadcrumbs */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link 
                href={effectiveIsOwner ? "/merchant/products" : "/buyer/catalogue"} 
                className="hover:text-primary transition-colors"
            >
                {effectiveIsOwner ? "Inventory" : (product.categoryTag || "Catalogue")}
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-slate-900 dark:text-white truncate max-w-[200px] font-bold">{product.name}</span>
        </nav>

        {effectiveIsOwner && (
            <div className="flex items-center gap-3">
                <button 
                    onClick={handleDelete}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                    Delete
                </button>
                <button 
                    onClick={() => router.push(`/merchant/products/${product.id}/edit`)}
                    className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                    Edit Product
                </button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
        {/* Gallery Section */}
        <div className="xl:col-span-12 lg:xl:col-span-7 flex flex-col md:flex-row gap-4">
          <div className="order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0 no-scrollbar">
            <button className="w-16 h-16 rounded-lg border-2 border-primary bg-white dark:bg-slate-900 overflow-hidden shrink-0 shadow-sm">
               {product.imageUrl ? <img src={optimizeCloudinaryUrl(product.imageUrl, 150)} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200"><span className="material-symbols-outlined">image</span></div>}
            </button>
            <div className="w-16 h-16 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden shrink-0 opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center cursor-default">
              <span className="material-symbols-outlined text-slate-300">photo_library</span>
            </div>
          </div>
          <div className="order-1 md:order-2 flex-1 relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
            {product.imageUrl ? (
              <img src={optimizeCloudinaryUrl(product.imageUrl, 800)} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <span className="material-symbols-outlined text-[80px] text-slate-200 dark:text-slate-800">inventory_2</span>
              </div>
            )}
            {!effectiveIsOwner && (
                <button 
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={cn(
                        "absolute top-5 right-5 p-2.5 bg-white shadow-md border border-slate-100 rounded-full transition-transform hover:scale-110",
                        isFavorite ? "text-rose-500" : "text-slate-300"
                    )}
                >
                    <span className={cn("material-symbols-outlined text-xl", isFavorite && "font-variation-fill")}>favorite</span>
                </button>
            )}
            {effectiveIsOwner && (
                 <div className="absolute top-5 right-5 flex flex-col gap-2">
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.origin + `/buyer/products/${product.id}`);
                            toast.success("Public link copied!");
                        }}
                        className="p-2.5 bg-white shadow-md border border-slate-100 rounded-full text-slate-400 hover:text-primary transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">share</span>
                    </button>
                 </div>
            )}
          </div>
        </div>

        {/* Info Column */}
        <div className="xl:col-span-12 lg:xl:col-span-5 flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full border border-primary/20">
                  {product.categoryTag || "General"}
                </span>
                {effectiveIsOwner && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                        <div 
                            onClick={handleToggleActive}
                            className={cn(
                                "w-9 h-5 rounded-full relative transition-colors cursor-pointer",
                                product.isActive ? "bg-emerald-500" : "bg-slate-300"
                            )}
                        >
                            <div className={cn(
                                "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                                product.isActive ? "left-4.5" : "left-0.5"
                            )} />
                        </div>
                    </div>
                )}
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                    <StarRating rating={4} readOnly size="sm" />
                    <span className="text-slate-900 dark:text-white font-bold text-sm ml-1">4.0</span>
                </div>
                <span className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold uppercase tracking-wider">({reviews.length} Verified Reviews)</span>
                
                {product.productCode && (
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">SKU</span>
                        <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">{product.productCode}</span>
                        <button onClick={handleCopySKU} className="material-symbols-outlined text-sm text-slate-300 hover:text-primary transition-colors">
                            {copiedSku ? 'check' : 'content_copy'}
                        </button>
                   </div>
                )}
            </div>

            {/* Merchant Card (For Buyer) */}
            {!effectiveIsOwner && merchant && (
              <Link href={`/buyer/merchants/${merchant.id}`}>
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:border-primary/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 overflow-hidden">
                       {merchant.profileImage ? <img src={merchant.profileImage} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-primary/60">storefront</span>}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{merchant.businessName}</p>
                      <p className="text-slate-400 text-[9px] font-bold flex items-center gap-1 uppercase tracking-wider mt-0.5">
                        <span className="material-symbols-outlined text-[10px] text-emerald-500 font-variation-fill">verified_user</span> 
                        Verified Partner
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 border border-slate-200 text-slate-600 group-hover:bg-primary group-hover:text-white group-hover:border-primary text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all">
                    Visit Store
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Pricing Box */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Retail Price</p>
                    <div className="flex items-end gap-1">
                        <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{formatKobo(retail)}</p>
                        <p className="text-xs font-bold text-slate-300 mb-1">/ {product.unit || "unit"}</p>
                    </div>
                </div>
                {wholesale > 0 && (
                    <div className="space-y-1 text-right">
                        <p className="text-emerald-600/60 text-[10px] font-bold uppercase tracking-widest">Wholesale</p>
                        <div className="flex items-end justify-end gap-1">
                            <p className="text-3xl font-bold text-emerald-600 tracking-tight">{formatKobo(wholesale)}</p>
                            <p className="text-xs font-bold text-emerald-600/40 mb-1">/ unit</p>
                        </div>
                    </div>
                )}
             </div>

            {wholesale > 0 && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-primary/10 border border-emerald-100/50 rounded-lg">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-sm">inventory</span>
                    <p className="text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        Wholesale available from {product.minOrderQuantity} units
                    </p>
                </div>
                {bulkSavings > 0 && (
                  <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                    Save {bulkSavings}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Business Stats (Owner Only) */}
          {effectiveIsOwner && (
            <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-100 dark:border-slate-800">
                <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Sales</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">0</p>
                </div>
                <div className="text-center border-x border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stock Level</p>
                    <p className={cn("text-lg font-bold", isLowStock ? "text-amber-500" : "text-emerald-500")}>
                        {stock}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Revenue</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">₦0</p>
                </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            {!effectiveIsOwner && (
                <>
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
                            className="flex-1 bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900 h-12 rounded-lg font-extrabold hover:opacity-90 transition-all uppercase tracking-widest text-[11px]"
                        >
                            Checkout Now
                        </button>
                    </div>
                    <button 
                        onClick={() => handleAddToCart(PriceType.RETAIL)}
                        className="w-full bg-primary text-white h-14 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/10 hover:translate-y-[-1px] transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-xl">shopping_bag</span>
                        Add to Order
                    </button>
                    <button 
                        onClick={() => {
                            const phone = merchant?.contact?.phone?.replace(/\D/g, "") || "2340000000000";
                            window.open(`https://wa.me/${phone}?text=Hi, I'm interested in your product: ${product.name}`, "_blank");
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3.5 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[#25D366] text-lg">chat</span>
                        Chat on WhatsApp
                    </button>
                </>
            )}
            
            {effectiveIsOwner && (
                <button 
                    onClick={() => router.push(`/merchant/products/${product.id}/edit`)}
                    className="w-full bg-primary text-white h-14 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/10 hover:translate-y-[-1px] transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                    <span className="material-symbols-outlined text-xl">inventory</span>
                    Manage Inventory
                </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <section className="mt-12 bg-white dark:bg-white/5 p-8 rounded-xl border border-slate-100 dark:border-slate-800/50">
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-8 mb-8 no-scrollbar">
          {(['overview', 'specs', 'reviews', 'shipping'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                    "pb-4 font-bold text-[10px] uppercase tracking-[0.15em] transition-all whitespace-nowrap",
                    activeTab === tab ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-slate-600 border-b-2 border-transparent"
                )}
              >
                {tab === 'specs' ? 'Specifications' : tab === 'reviews' ? `Reviews (${reviews.length})` : tab}
              </button>
          ))}
        </div>

        <div className="max-w-4xl text-sm leading-relaxed min-h-[150px]">
          {activeTab === 'overview' && (
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
               <h3 className="text-sm font-black mb-4 text-slate-900 dark:text-white uppercase tracking-widest">Product Description</h3>
               <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-3xl">
                 {product?.description || "High-quality professional quality product available on Swifta."}
               </p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
               <div className="flex justify-between py-3 border-b border-slate-50 dark:border-white/5">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product SKU</span>
                 <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">{product?.productCode || "N/A"}</span>
               </div>
               <div className="flex justify-between py-3 border-b border-slate-50 dark:border-white/5">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit Specification</span>
                 <span className="font-bold text-slate-900 dark:text-white text-xs uppercase">{product?.unit || "Unit"}</span>
               </div>
               <div className="flex justify-between py-3 border-b border-slate-50 dark:border-white/5">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wholesale Threshold</span>
                 <span className="font-bold text-slate-900 dark:text-white text-xs">{product?.minOrderQuantity} Units</span>
               </div>
                <div className="flex justify-between py-3 border-b border-slate-50 dark:border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight (Approx)</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{product?.weightKg ? `${product.weightKg}kg` : "N/A"}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-50 dark:border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Origin</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{product?.warehouseLocation || "Merchant Hub"}</span>
                </div>
                 <div className="flex justify-between py-3 border-b border-slate-50 dark:border-white/5">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Availability</span>
                   <span className={cn("font-bold text-xs uppercase", product.isActive ? "text-emerald-500" : "text-amber-500")}>
                        {product.isActive ? "In Distribution" : "De-listed"}
                   </span>
                 </div>
              </div>
          )}

          {activeTab === 'reviews' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-300">
               {reviews.length > 0 ? (
                 reviews.map((r, i) => (
                   <div key={i} className="flex gap-4 p-4 rounded-xl border border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                     <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700 shadow-sm">
                       <span className="material-symbols-outlined text-slate-300 text-lg">person</span>
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {r.buyerName || "Verified Buyer"}
                          </span>
                          <StarRating rating={(r as any).rating || 5} readOnly size="sm" />
                        </div>
                       <p className="text-xs text-slate-500 italic font-medium leading-relaxed">&quot;{r.comment}&quot;</p>
                       <p className="mt-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-emerald-500 font-variation-fill">verified</span>
                            Verified Purchase
                       </p>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                    <span className="material-symbols-outlined text-4xl mb-4 opacity-10">rate_review</span>
                    <p className="font-black text-[10px] uppercase tracking-[0.2em]">No Verified Feedback Yet</p>
                 </div>
               )}
             </div>
          )}

          {activeTab === 'shipping' && (
            <div className="animate-in fade-in slide-in-from-bottom-1 duration-300 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-xl">local_shipping</span>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">Processing Time</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed">
                                {product.processingDays === 0 ? "Ships same day" : `Merchant prepares order in ${product.processingDays || 3} business days`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-xl">location_on</span>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">Stock Fulfillment</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed">
                                Ships from {product.warehouseLocation || "Merchant Distribution Hub"}
                            </p>
                        </div>
                    </div>
               </div>

               <div className="p-6 bg-slate-900 dark:bg-primary/5 rounded-2xl text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
                        Logistics Guarantee
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        Swifta handles all logistics calculations. Shipping fees are dynamically adjusted based on the merchant&apos;s location and your delivery target.
                    </p>
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Insurance Coverage</p>
                        <p className="text-[10px] text-slate-500 mt-1 italic">All transit orders are covered by Swifta Goods-in-Transit protection.</p>
                    </div>
               </div>
            </div>
          )}
        </div>
      </section>

      {/* Recommendations (Buyer Only) */}
      {!effectiveIsOwner && merchantProducts.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">More from this Merchant</h2>
            <Link href={`/buyer/merchants/${merchant?.id || ''}`} className="text-[9px] font-bold text-primary uppercase tracking-widest hover:underline">View Storefront</Link>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
            {merchantProducts.map((p) => (
              <Link 
                href={`/buyer/products/${p.id}`}
                key={p.id} 
                className="min-w-[240px] bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 snap-start hover:shadow-md transition-all group"
              >
                <div className="aspect-square relative overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-950 mb-4 border border-slate-100 dark:border-slate-800">
                  {p.imageUrl ? (
                    <img src={optimizeCloudinaryUrl(p.imageUrl, 400)} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200"><span className="material-symbols-outlined text-3xl">inventory_2</span></div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-xs line-clamp-1 tracking-tight">{p.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-primary tracking-tight">{formatKobo(Number(p.retailPriceKobo || p.pricePerUnitKobo || 0))}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sticky Mobile Footer (Buyer Only) */}
      {!effectiveIsOwner && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-[60] p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex items-center justify-between animate-in slide-in-from-bottom-full duration-500">
          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Retail Price</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900 dark:text-white">{formatKobo(retail)}</span>
              <span className="text-[10px] font-bold text-slate-400">/{product.unit || "unit"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={() => {
                    const phone = merchant?.contact?.phone?.replace(/\D/g, "") || "2340000000000";
                    window.open(`https://wa.me/${phone}?text=Hi, I'm interested in: ${product.name}`, "_blank");
                }}
                className="size-12 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl text-[#25D366] active:scale-95 transition-all"
            >
                <span className="material-symbols-outlined text-2xl font-variation-fill">chat</span>
            </button>
            <button 
                onClick={() => handleAddToCart(PriceType.RETAIL)}
                className="bg-primary text-white h-12 px-8 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
                Add to Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
