"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { merchantApi } from "@/lib/api/merchant.api";
import { productApi } from "@/lib/api/product.api";
import { getMerchantReviews } from "@/lib/api/review.api";
import type { MerchantProfile, Product, Review } from "@swifta/shared";
import { DEFAULT_COVER, getDisplayName } from "@swifta/shared";
import { CatalogueGrid } from "@/components/buyer/catalogue/catalogue-grid";
import { StarRating } from "@/components/ui/star-rating";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";
import { cn, formatKobo } from "@/lib/utils";
import { EditProfileModal } from "./edit-profile-modal";
import { ProductCard } from "@/components/shared/product-card";
import { VerificationBadge } from "@/components/shared/verification-badge";


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
  const [isStarred, setIsStarred] = useState(false);
  const [starLoading, setStarLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<'products' | 'discounts' | 'reviews'>('products');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showVerificationDetails, setShowVerificationDetails] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const id = merchantId || initialMerchant?.id;
  const isOwner = !!(user && String(user.merchantId) === String(id));

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
          const { isFollowing: followingStatus } = await merchantApi.isStarred(id);
          setIsStarred(followingStatus);
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

  const handleStarToggle = async () => {
    if (!user) {
      toast.error("Please login to star merchants");
      return;
    }
    if (!id) return;

    setStarLoading(true);
    try {
      if (isStarred) {
        await merchantApi.unstarMerchant(id);
        setIsStarred(false);
        toast.success("Unstarred merchant");
      } else {
        await merchantApi.starMerchant(id);
        setIsStarred(true);
        toast.success("Starred merchant");
      }
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setStarLoading(false);
    }
  };

  const renderProductGrid = (productList: Product[]) => {
    if (productList.length === 0) {
      return (
        <div className="py-20 text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-foreground-muted/30">search_off</span>
          <h4 className="text-lg font-bold text-foreground">No products found</h4>
          <p className="text-foreground-muted text-sm">
            {isOwner ? "Add your first product to start selling." : "This store hasn't listed any products yet."}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {productList.map((p) => (
          <ProductCard 
            key={p.id} 
            product={p} 
            isOwner={isOwner} 
            showMerchant={false}
          />
        ))}
      </div>
    );
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p className="text-sm font-bold text-foreground-muted uppercase tracking-widest">Loading Profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-20 text-center space-y-4 flex flex-col items-center">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <h2 className="text-xl font-bold text-foreground">Profile Not Found</h2>
        <p className="text-foreground-muted">{error || "This merchant profile could not be loaded."}</p>
        <button onClick={() => router.back()} className="px-6 py-2.5 border border-border rounded-xl text-sm font-bold hover:bg-background-secondary transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const verificationTier = profile.verificationTier;
  const coverImage = profile.coverImage;

  return (
    <div className="min-h-full bg-background font-display text-foreground">
      {/* Cover Section */}
      <div className="relative pt-0 sm:pt-4 sm:px-4 md:px-8">
        <div className="h-56 md:h-64 w-full relative rounded-none sm:rounded-xl overflow-hidden bg-background-secondary border-b sm:border border-border/50 shadow-sm">
          <img 
            src={coverImage || DEFAULT_COVER} 
            alt="Cover" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Share Button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied");
            }}
            className="absolute top-4 left-4 bg-surface/90 backdrop-blur-md text-foreground rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all shadow-sm border border-border"
          >
            <span className="material-symbols-outlined text-sm">share</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Share</span>
          </button>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-12 left-4 sm:left-8 md:left-16 size-24 md:size-32 border-4 border-surface bg-surface overflow-hidden shadow-md rounded-xl">
          {profile.profileImage ? (
            <img src={profile.profileImage} alt={profile.businessName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-background-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-primary/40 text-4xl">storefront</span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="mt-16 px-4 md:px-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">
              {profile.businessName}
            </h2>
              <VerificationBadge tier={verificationTier} size="lg" />
          </div>

          <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
            <span className="px-2 py-0.5 bg-background-secondary text-foreground-muted text-[10px] font-bold uppercase tracking-widest rounded-md">
              {profile.slug}
            </span>
            <div className="flex items-center gap-1.5 text-foreground-muted text-[10px] md:text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">location_on</span>
              <span className="truncate max-w-[150px] md:max-w-none">{profile.businessAddress || "Location not set"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground-muted text-[10px] md:text-xs font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm">group</span>
              <span className="text-foreground">{profile.followersCount || 0}</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[10px] text-amber-400">star</span>Stars</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {isOwner ? (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 md:px-5 py-2 md:py-2.5 bg-foreground text-background rounded-lg font-bold text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all flex-1 sm:flex-none justify-center"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit Profile
            </button>
          ) : user ? (
            <button
              onClick={handleStarToggle}
              disabled={starLoading}
              className={cn(
                "px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-bold text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 flex-1 sm:flex-none justify-center",
                isStarred
                  ? "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400"
                  : "bg-white text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 hover:border-amber-400 hover:text-amber-600 shadow-sm"
              )}
            >
              <span className={cn("material-symbols-outlined text-[16px]", isStarred ? "font-variation-fill" : "")}>
                star
              </span>
              {starLoading ? "..." : isStarred ? 'Starred' : 'Star'}
            </button>
          ) : null}

          {profile.contact?.phone && (
            <a
              href={`https://wa.me/${profile.contact.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 md:px-5 py-2 md:py-2.5 border border-emerald-100 text-emerald-600 rounded-lg font-bold text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 transition-all flex-1 sm:flex-none justify-center"
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Verification Details */}
      <div className="mt-8 px-4 md:px-16">
        <div className="bg-surface rounded-xl p-6 border border-border">
          <button 
            onClick={() => setShowVerificationDetails(!showVerificationDetails)}
            className="w-full flex items-center justify-between mb-0 group"
          >
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-tight">
              <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
              Business Verification
            </h3>
            <span className={cn(
              "material-symbols-outlined text-foreground-muted transition-transform duration-300 text-lg",
              showVerificationDetails ? "rotate-180" : ""
            )}>
              keyboard_arrow_down
            </span>
          </button>
          
          {showVerificationDetails && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className={`flex items-center gap-2 p-2.5 bg-background-secondary rounded-lg border ${profile.verificationTier !== 'UNVERIFIED' ? 'border-primary/10' : 'border-border opacity-60'}`}>
                <span className={cn("material-symbols-outlined text-sm font-variation-fill", profile.verificationTier !== 'UNVERIFIED' ? "text-primary" : "text-foreground-muted/40")}>
                  {profile.verificationTier !== 'UNVERIFIED' ? 'check_circle' : 'cancel'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Level 1: Basic</span>
              </div>
              <div className={`flex items-center gap-2 p-2.5 bg-background-secondary rounded-lg border ${profile.ninVerified ? 'border-primary/10' : 'border-border opacity-60'}`}>
                <span className={cn("material-symbols-outlined text-sm font-variation-fill", profile.ninVerified ? "text-primary" : "text-foreground-muted/40")}>
                  {profile.ninVerified ? 'check_circle' : 'cancel'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Level 2: Identity</span>
              </div>
              <div className={`flex items-center gap-2 p-2.5 bg-background-secondary rounded-lg border ${profile.cacVerified ? 'border-primary/10' : 'border-border opacity-60'}`}>
                <span className={cn("material-symbols-outlined text-sm font-variation-fill", profile.cacVerified ? "text-primary" : "text-foreground-muted/40")}>
                  {profile.cacVerified ? 'check_circle' : 'cancel'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Level 3: Business</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10 px-4 md:px-16 border-b border-border flex justify-between items-end overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 sm:gap-8">
          {(['products', 'discounts', 'reviews'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-4 px-2 font-bold transition-all capitalize flex items-center gap-2 text-sm whitespace-nowrap",
                activeTab === tab
                  ? "text-primary border-b-2 border-primary"
                  : "text-foreground-muted hover:text-foreground"
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
          <div className="hidden sm:flex items-center gap-1 bg-background-secondary p-1 rounded-xl mb-3">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                viewMode === 'grid' ? "bg-surface text-primary shadow-sm" : "text-foreground-muted hover:text-foreground"
              )}
            >
              <span className="material-symbols-outlined text-lg">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                viewMode === 'table' ? "bg-surface text-primary shadow-sm" : "text-foreground-muted hover:text-foreground"
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
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Add Product
                </button>
              )}
            </div>
            {renderProductGrid(products)}
          </div>
        )}

        {activeTab === 'discounts' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold italic text-foreground">Wholesale Discounts</h3>
            </div>
            {renderProductGrid(products.filter(p => (p as any).wholesaleDiscountPercent > 0))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">Buyer Feedback</h3>
                <p className="text-xs text-foreground-muted font-medium mt-1 uppercase tracking-wider">Verified platform reviews</p>
              </div>
              <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-lg border border-border">
                {profile.averageRating != null ? (
                  <>
                    <span className="text-xl font-bold text-foreground">{profile.averageRating.toFixed(1)}</span>
                    <StarRating rating={profile.averageRating} readOnly size="sm" />
                  </>
                ) : (
                  <span className="text-xs font-bold text-foreground-muted uppercase tracking-widest">No ratings yet</span>
                )}
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="py-20 text-center bg-surface rounded-xl border border-border">
                <span className="material-symbols-outlined text-3xl text-foreground-muted/30 mb-2 block">rate_review</span>
                <p className="font-bold uppercase tracking-widest text-[10px] text-foreground-muted/40">No reviews yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col gap-3">
                    <StarRating rating={rev.rating} readOnly size="sm" />
                    <p className="text-foreground-secondary text-xs italic leading-relaxed">&quot;{rev.comment || "Great products and service!"}&quot;</p>
                    <div className="mt-auto text-[9px] font-bold uppercase tracking-widest text-foreground-muted/30">Verified Trade</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {profile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onSuccess={(updated: MerchantProfile) => setProfile(updated)}
        />
      )}
    </div>
  );
}
