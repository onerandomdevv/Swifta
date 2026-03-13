"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { merchantApi } from "@/lib/api/merchant.api";
import { productApi } from "@/lib/api/product.api";
import { getMerchantReviews } from "@/lib/api/review.api";
import type { MerchantProfile, Product, Review } from "@hardware-os/shared";
import { CatalogueGrid } from "@/components/buyer/catalogue/catalogue-grid";
import { StarRating } from "@/components/ui/star-rating";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";
import { cn, formatKobo } from "@/lib/utils";
import { EditProfileModal } from "./edit-profile-modal";

const DEFAULT_COVER = "/default-cover.jpg";

interface MerchantProfileViewProps {
  initialMerchant?: MerchantProfile;
  merchantId?: string;
}

export function MerchantProfileView({ initialMerchant, merchantId }: MerchantProfileViewProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(!initialMerchant);
  const [profile, setProfile] = useState<MerchantProfile | null>(initialMerchant || null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<'products' | 'discounts' | 'reviews'>('products');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showVerificationDetails, setShowVerificationDetails] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const id = merchantId || initialMerchant?.id;
  const isOwner = !!(user && String(user.merchantId) === String(id));

  const handleCopyProductCode = (product: Product) => {
    navigator.clipboard.writeText(product.productCode);
    setCopiedId(product.id);
    toast.success("Product code copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStockBadge = (product: Product) => {
    const stock = product.stockCache?.stock ?? 0;
    if (stock <= 0) {
      return (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-full shadow-sm">
          <span className="material-symbols-outlined text-sm font-bold">error</span>
          <span className="text-[11px] font-bold uppercase tracking-wider leading-none">Out of Stock</span>
        </div>
      );
    }
    if (stock <= 10) {
      return (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full shadow-sm">
          <span className="material-symbols-outlined text-sm font-bold">warning</span>
          <span className="text-[11px] font-bold uppercase tracking-wider leading-none">Low Stock</span>
        </div>
      );
    }
    return null;
  };

  const formatPrice = (priceKobo: string | number | null | undefined) => {
    if (!priceKobo || Number(priceKobo) === 0) return <span className="text-emerald-500 font-bold">—</span>;
    return (Number(priceKobo) / 100).toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    });
  };

  const renderPriceSection = (p: Product) => (
    <div className="flex items-center gap-4 pt-3 border-t border-slate-50 dark:border-slate-800">
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 font-semibold uppercase">Retail</span>
        <span className="text-sm font-bold text-slate-900 dark:text-slate-200">
          {formatKobo(Number(p.retailPriceKobo || p.pricePerUnitKobo || 0))}
          <span className="text-[10px] text-slate-400 font-normal ml-0.5">/ {p.unit || "unit"}</span>
        </span>
      </div>
      <div className="w-[1px] h-6 bg-slate-100 dark:bg-slate-800"></div>
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 font-semibold uppercase">Wholesale</span>
        <span className="text-sm font-bold text-primary">
          {formatKobo(Number(p.wholesalePriceKobo || 0))}
          <span className="text-[10px] text-primary/60 font-normal ml-0.5">/ {p.unit || "unit"}</span>
        </span>
      </div>
    </div>
  );

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;
    try {
      await productApi.deleteProduct(product.id);
      setProducts(products.filter(p => p.id !== product.id));
      toast.success("Product deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchInitialData = async () => {
      try {
        if (!initialMerchant) {
          const profileData = await merchantApi.getPublicProfile(id);
          setProfile(profileData);
        }

        const productsData = await productApi.getPublicProductsByMerchant(id);
        setProducts(productsData as unknown as Product[]);

        if (user) {
          const { isFollowing: followingStatus } = await merchantApi.isFollowing(id);
          setIsFollowing(followingStatus);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load merchant profile");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, initialMerchant, user]);

  useEffect(() => {
    if (!id || activeTab !== 'reviews') return;

    const fetchReviews = async () => {
      try {
        const reviewsData = await getMerchantReviews(id, 1, 10);
        setReviews(reviewsData);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      }
    };

    fetchReviews();
  }, [id, activeTab]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error("Please login to follow merchants");
      return;
    }
    if (!id) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await merchantApi.unfollowMerchant(id);
        setIsFollowing(false);
        toast.success("Unfollowed merchant");
      } else {
        await merchantApi.followMerchant(id);
        setIsFollowing(true);
        toast.success("Following merchant!");
      }
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setFollowLoading(false);
    }
  };

  const renderOwnerProductGrid = (productList: Product[]) => {
    if (productList.length === 0) {
      return (
        <div className="py-20 text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">No products found</h4>
          <p className="text-slate-500 text-sm">Add your first product to start selling.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {productList.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col group hover:shadow-xl transition-all duration-300"
          >
            {/* Top Section: Image */}
            <div className="relative aspect-square w-full p-4">
              <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 relative">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-200 dark:text-slate-700 text-6xl">inventory_2</span>
                  </div>
                )}
                {/* Stock Badge Overlay */}
                {getStockBadge(p)}
                
                {/* Wholesale Discount Badge */}
                {p.wholesaleDiscountPercent && p.wholesaleDiscountPercent > 0 && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-primary text-white text-[10px] font-black rounded-lg shadow-lg">
                    {p.wholesaleDiscountPercent}% OFF
                  </div>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="px-6 pb-6 pt-2 flex flex-col grow">
              <div className="mb-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                    SKU: {p.productCode || p.id.slice(0, 8).toUpperCase()}
                  </p>
                  <button 
                    onClick={() => handleCopyProductCode(p)}
                    className="size-6 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-300 hover:text-primary transition-all"
                    title="Copy SKU"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedId === p.id ? "check_circle" : "content_copy"}
                    </span>
                  </button>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {p.name}
                </h3>
                {p.shortDescription && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {p.shortDescription}
                  </p>
                )}
              </div>
              
              {/* Pricing Row */}
              {renderPriceSection(p)}

              {/* Action */}
              <div className="mt-8">
                <button 
                  onClick={() => router.push(`/merchant/products/${p.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all outline-none"
                >
                  <span className="material-symbols-outlined text-xl">visibility</span>
                  View Product
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProductTable = (productList: Product[]) => {
    if (productList.length === 0) {
      return (
        <div className="py-20 text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">No products found</h4>
          <p className="text-slate-500 text-sm">Add your first product to start selling.</p>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Product</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Retail Price</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Wholesale</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Stock</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {productList.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden border border-slate-100 dark:border-slate-700 shrink-0">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600">inventory_2</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{p.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          SKU: {p.productCode || p.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                      {p.categoryTag || "General"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatKobo(Number(p.retailPriceKobo || p.pricePerUnitKobo || 0))}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium lowercase">per {p.unit || "unit"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {p.wholesalePriceKobo ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary">
                          {formatKobo(Number(p.wholesalePriceKobo))}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-primary/60 font-medium lowercase">per {p.unit || "unit"}</span>
                          {p.wholesaleDiscountPercent && p.wholesaleDiscountPercent > 0 && (
                            <span className="text-[9px] font-black text-primary uppercase ml-1">-{p.wholesaleDiscountPercent}%</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "size-1.5 rounded-full",
                        (p.stockCache?.stock ?? 0) <= 0 ? "bg-red-500" : (p.stockCache?.stock ?? 0) <= 10 ? "bg-amber-500" : "bg-emerald-500"
                      )} />
                      <span className={cn(
                        "text-sm font-bold",
                        (p.stockCache?.stock ?? 0) <= 0 ? "text-red-500" : (p.stockCache?.stock ?? 0) <= 10 ? "text-amber-500" : "text-slate-700 dark:text-slate-200"
                      )}>
                        {p.stockCache?.stock ?? 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => router.push(`/merchant/products/${p.id}`)}
                      className="inline-flex items-center justify-center size-9 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all outline-none"
                    >
                      <span className="material-symbols-outlined text-xl">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBuyerProductGrid = (productList: Product[]) => {
    if (productList.length === 0) {
      return (
        <div className="py-20 text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">No products found</h4>
          <p className="text-slate-500 text-sm">This store hasn&apos;t listed any products yet.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {productList.map((p) => (
          <div
            key={p.id}
            className="group cursor-pointer"
            onClick={() => router.push(`/buyer/products/${p.id}`)}
          >
            {/* Square Image Container */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-white/5 shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-500">
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-200 dark:text-slate-700 text-6xl">inventory_2</span>
                </div>
              )}
              
              {/* Category Tag overlay */}
              <span className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm border border-white/20">
                {p.categoryTag || "General"}
              </span>

              {/* Wholesale Discount Badge */}
              {p.wholesaleDiscountPercent && p.wholesaleDiscountPercent > 0 && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-primary text-white text-[10px] font-black rounded-xl shadow-lg animate-in zoom-in duration-500">
                  SAVE {p.wholesaleDiscountPercent}%
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="mt-6 space-y-1">
              <h4 className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                {p.name}
              </h4>
              {p.shortDescription && (
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pb-2">
                  {p.shortDescription}
                </p>
              )}
              
              <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Retail Price</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatKobo(Number(p.retailPriceKobo || p.pricePerUnitKobo || 0))}
                    <span className="text-xs text-slate-400 font-bold ml-1">/ {p.unit || "unit"}</span>
                  </span>
                </div>
                
                {p.wholesalePriceKobo && (
                  <div className="flex flex-col items-end text-right">
                    <span className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Wholesale</span>
                    <span className="text-lg font-extrabold text-primary/80 tracking-tight">
                      {formatKobo(Number(p.wholesalePriceKobo))}
                      <span className="text-[10px] font-bold ml-0.5">/ {p.unit || "unit"}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-20 text-center space-y-4 flex flex-col items-center">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Not Found</h2>
        <p className="text-slate-500">{error || "This merchant profile could not be loaded."}</p>
        <button onClick={() => router.back()} className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const isVerified = profile.verificationTier === "VERIFIED" || profile.verificationTier === "TRUSTED";

  return (
    <div className="min-h-full bg-[#f8fafc] dark:bg-[#0f172a] font-display text-slate-900 dark:text-slate-100">
      {/* Cover Section */}
      <div className="relative px-4 pt-4 md:px-8">
        <div className="h-64 md:h-80 w-full relative rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800">
          {profile.coverImage ? (
            <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-slate-200 to-slate-300 dark:from-primary/10 dark:via-slate-800 dark:to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Share Button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied to clipboard");
            }}
            className="absolute top-4 left-4 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl px-4 py-2 flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-lg">share</span>
            <span className="text-sm font-medium">Share Profile</span>
          </button>
        </div>

        {/* Avatar */}
        <div className={`absolute -bottom-16 left-8 md:left-16 size-32 md:size-40 border-4 border-white dark:border-[#0f172a] bg-white dark:bg-slate-800 overflow-hidden shadow-xl ${isVerified ? 'rounded-2xl' : 'rounded-full'}`}>
          {profile.profileImage ? (
            <img src={profile.profileImage} alt={profile.businessName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl md:text-6xl">storefront</span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="mt-20 px-4 md:px-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {profile.businessName}
            </h2>
            {isVerified && (
              <span className="material-symbols-outlined text-blue-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-sm font-medium">
              {profile.slug}
            </span>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
              <span className="material-symbols-outlined text-lg">location_on</span>
              <span>{profile.businessAddress || "Location not set"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
              <span className="material-symbols-outlined text-lg">group</span>
              <span className="text-slate-900 dark:text-slate-200">{profile.followersCount || 0}</span>
              <span>Followers</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
              <span className="material-symbols-outlined text-lg text-primary">handshake</span>
              <span className="text-slate-900 dark:text-slate-200">{profile.dealsClosed || 0}</span>
              <span>Deals Closed</span>
            </div>
          </div>

          {profile.description && (
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg max-w-2xl leading-relaxed">
              {profile.description}
            </p>
          )}

          {/* Social Links & Website */}
          <div className="flex items-center gap-4 mt-4">
            {profile.websiteUrl && (() => {
              try {
                // Handle cases where the URL might be relative by providing a base
                // but checking the protocol of the resulting parsed URL
                const urlToTest = profile.websiteUrl.startsWith('http') 
                  ? profile.websiteUrl 
                  : `https://${profile.websiteUrl}`;
                const parsed = new URL(urlToTest);
                if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                  return (
                    <a href={profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
                      <span className="material-symbols-outlined text-lg">language</span>
                      Website
                    </a>
                  );
                }
              } catch (e) {
                // Invalid URL - don't render the link
              }
              return null;
            })()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {isOwner ? (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 md:flex-none px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Edit Profile
            </button>
          ) : user ? (
            <button
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={cn(
                "flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50",
                isFollowing
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                  : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
              )}
            >
              <span className="material-symbols-outlined text-lg">{isFollowing ? 'person_remove' : 'person_add'}</span>
              {followLoading ? "..." : isFollowing ? 'Unfollow' : 'Follow Business'}
            </button>
          ) : null}

          {profile.contact?.phone && (
            <a
              href={`https://wa.me/${profile.contact.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none px-6 py-3 bg-[#25D366] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-lg">chat</span>
              WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Verification Details */}
      <div className="mt-8 px-4 md:px-16">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setShowVerificationDetails(!showVerificationDetails)}
            className="w-full flex items-center justify-between mb-0 group"
          >
            <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <span className="material-symbols-outlined text-primary">verified_user</span>
              Business Verification Details
            </h3>
            <span className={cn(
              "material-symbols-outlined text-slate-400 transition-transform duration-300",
              showVerificationDetails ? "rotate-180" : ""
            )}>
              keyboard_arrow_down
            </span>
          </button>
          
          {showVerificationDetails && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border ${profile.cacVerified ? 'border-primary/20' : 'border-slate-100 dark:border-slate-800 opacity-60'}`}>
                <span className={cn("material-symbols-outlined", profile.cacVerified ? "text-primary" : "text-slate-400")}>
                  {profile.cacVerified ? 'check_circle' : 'cancel'}
                </span>
                <span className="text-sm font-medium">{profile.cacVerified ? 'CAC Verified' : 'CAC Not Verified'}</span>
              </div>
              <div className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border ${profile.addressVerified ? 'border-primary/20' : 'border-slate-100 dark:border-slate-800 opacity-60'}`}>
                <span className={cn("material-symbols-outlined", profile.addressVerified ? "text-primary" : "text-slate-400")}>
                  {profile.addressVerified ? 'check_circle' : 'cancel'}
                </span>
                <span className="text-sm font-medium">{profile.addressVerified ? 'Address Verified' : 'Address Not Verified'}</span>
              </div>
              <div className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border ${profile.bankVerified ? 'border-primary/20' : 'border-slate-100 dark:border-slate-800 opacity-60'}`}>
                <span className={cn("material-symbols-outlined", profile.bankVerified ? "text-primary" : "text-slate-400")}>
                  {profile.bankVerified ? 'check_circle' : 'cancel'}
                </span>
                <span className="text-sm font-medium">{profile.bankVerified ? 'Bank Verified' : 'Bank Not Verified'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10 px-4 md:px-16 border-b border-slate-200 dark:border-slate-800 flex justify-between items-end">
        <div className="flex gap-8">
          {(['products', 'discounts', 'reviews'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-4 px-2 font-bold transition-all capitalize flex items-center gap-2",
                activeTab === tab
                  ? "text-primary border-b-4 border-primary"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              {tab}
              {tab === 'products' && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black">
                  {products.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'products' && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-3">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <span className="material-symbols-outlined text-lg">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                viewMode === 'table' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <span className="material-symbols-outlined text-lg">table_rows</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="mt-8 px-4 md:px-16 pb-20 min-h-[400px]">
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-end mb-6">
              {isOwner && (
                <button
                  onClick={() => router.push('/merchant/products')}
                  className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Add Product
                </button>
              )}
            </div>
            {isOwner ? (
               viewMode === 'grid' ? renderOwnerProductGrid(products) : renderProductTable(products)
            ) : (
              renderBuyerProductGrid(products)
            )}
          </div>
        )}

        {activeTab === 'discounts' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold italic">Wholesale Discounts</h3>
            </div>
            {isOwner ? (
              renderOwnerProductGrid(products.filter(p => (p as any).wholesaleDiscountPercent > 0))
            ) : (
              renderBuyerProductGrid(products.filter(p => (p as any).wholesaleDiscountPercent > 0))
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Buyer Feedback</h3>
                <p className="text-sm text-slate-500">Verified reviews from platform trades</p>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-2xl font-black">{profile.averageRating?.toFixed(1) || "5.0"}</span>
                <StarRating rating={profile.averageRating || 5} readOnly size="sm" />
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="py-20 text-center opacity-50 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">rate_review</span>
                <p className="font-bold uppercase tracking-widest text-sm">No reviews yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                    <StarRating rating={rev.rating} readOnly size="sm" />
                    <p className="text-slate-600 dark:text-slate-400 italic">&quot;{rev.comment || "Great products and service!"}&quot;</p>
                    <div className="mt-auto text-[10px] font-bold uppercase tracking-widest text-slate-400">Verified Trade</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 px-4 md:px-16 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-xl">rocket_launch</span>
              </div>
              <span className="text-xl font-bold">SwiftTrade</span>
            </div>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              The ultimate marketplace solution for Nigerian merchants to scale and reach customers everywhere.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h5 className="text-sm font-bold mb-4 uppercase tracking-wider text-slate-400">Portal</h5>
              <ul className="space-y-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <li><a className="hover:text-primary transition-colors" href="/merchant/products">Inventory</a></li>
                <li><a className="hover:text-primary transition-colors" href="/merchant/payouts">Payouts</a></li>
                <li><a className="hover:text-primary transition-colors" href="/merchant/dashboard">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-bold mb-4 uppercase tracking-wider text-slate-400">Support</h5>
              <ul className="space-y-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <li><a className="hover:text-primary transition-colors" href="#">Help Center</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Terms of Use</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Privacy</a></li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h5 className="text-sm font-bold mb-4 uppercase tracking-wider text-slate-400">Legal</h5>
              <p className="text-xs text-slate-500">© 2025 SwiftTrade Technologies Ltd. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSuccess={(updated) => setProfile(updated)}
      />
    </div>
  );
}
