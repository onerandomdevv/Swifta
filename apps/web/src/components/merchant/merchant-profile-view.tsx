"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { merchantApi } from "@/lib/api/merchant.api";
import { productApi } from "@/lib/api/product.api";
import { getMerchantReviews } from "@/lib/api/review.api";
import type { MerchantProfile, Product, Review } from "@hardware-os/shared";
import { Button } from "@/components/ui/button";
import { CatalogueGrid } from "@/components/buyer/catalogue/catalogue-grid";
import { StarRating } from "@/components/ui/star-rating";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DEFAULT_COVER = "https://images.unsplash.com/photo-1541888062141-94575badd5eb?q=80&w=2000&auto=format&fit=crop";

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
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);

  const id = merchantId || initialMerchant?.id;

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center">Loading Trust Profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-20 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <h2 className="text-xl font-bold text-slate-900">Profile Not Found</h2>
        <p className="text-slate-500">{error || "This merchant profile could not be loaded."}</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F8FAFC] dark:bg-slate-900 animate-in fade-in duration-700 font-sans text-[#0A2540] dark:text-white">
      {/* Header: Banner & Overlapping Profile Pic */}
      <div className="w-full max-w-[1400px] ml-0 px-8 pt-10">
        <div className="relative">
          <div 
            className="h-64 md:h-80 w-full rounded-2xl overflow-hidden shadow-sm bg-slate-200 dark:bg-slate-800 bg-cover bg-center"
            style={{ backgroundImage: `url('${profile.coverImage || DEFAULT_COVER}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>

          <div className="absolute -bottom-16 left-8">
            <div className={`w-32 h-32 md:w-40 md:h-40 border-4 border-white dark:border-slate-900 overflow-hidden bg-white dark:bg-slate-800 shadow-lg relative group ${profile.verificationTier === 'TRUSTED' ? 'rounded-2xl' : 'rounded-full'}`}>
              {profile.profileImage ? (
                <img src={profile.profileImage} alt={profile.businessName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-5xl md:text-6xl">storefront</span>
                </div>
              )}
            </div>
          </div>

          <button 
            className="absolute top-4 left-4 p-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-600 shadow-sm hover:bg-white transition-all z-10"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied to clipboard");
            }}
          >
            <span className="material-symbols-outlined text-xl">share</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-[1400px] ml-0 px-8 mt-20">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl md:text-6xl font-black text-navy-dark dark:text-white leading-[1.1] tracking-tighter">
                  {profile.businessName}
                </h1>
                {(profile.verificationTier === "VERIFIED" || profile.verificationTier === "TRUSTED") && (
                  <span className="material-symbols-outlined text-blue-500 fill-1 text-3xl md:text-4xl">verified</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full w-fit">
                <span className="material-symbols-outlined text-sm text-slate-500">alternate_email</span>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">@{profile.slug}</span>
              </div>
              
              {profile.description && (
                <p className="text-slate-600 dark:text-slate-400 text-xl font-medium leading-relaxed max-w-3xl">
                  {profile.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-10 gap-y-4 text-sm font-bold tracking-tight text-slate-500">
               <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl text-slate-400">location_on</span>
                <span className="text-navy-dark/70 dark:text-slate-300">{profile.businessAddress || "Lagos, Nigeria"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl text-slate-400">group</span>
                <span className="text-navy-dark/70 dark:text-slate-300">{profile.followersCount || 0} Followers</span>
              </div>
            </div>

            <div>
              <button onClick={() => setIsVerificationOpen(!isVerificationOpen)} className="text-blue-600 font-bold flex items-center gap-1.5 hover:text-blue-800 transition-colors py-1">
                More Details <span className={cn("material-symbols-outlined text-lg transition-transform", isVerificationOpen && "rotate-180")}>expand_more</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-end gap-4 w-full md:w-auto">
            <div className="flex gap-3 w-full md:w-auto">
              {user && String(user.merchantId) !== String(id) && (
                <Button 
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={cn(
                    "h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg",
                    isFollowing ? "bg-slate-200 text-slate-600 hover:bg-slate-300" : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                  )}
                >
                  <span className="material-symbols-outlined mr-2 text-lg">{isFollowing ? 'person_remove' : 'person_add'}</span>
                  {isFollowing ? 'Unfollow' : 'Follow Business'}
                </Button>
              )}
              {profile.contact?.phone && (
                <a
                  href={`https://wa.me/${profile.contact.phone.replace(/\D/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-8 h-12 rounded-xl bg-[#00D084] hover:bg-[#00B873] text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center shadow-lg shadow-[#00D084]/20 hover:scale-105 transition-all flex-1 md:flex-none"
                >
                  <span className="material-symbols-outlined mr-2 text-lg">chat</span>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {isVerificationOpen && (
        <div className="w-full max-w-[1400px] ml-0 px-8 mt-4">
          <div className="w-full md:w-96 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 font-bold flex items-center">
              <span className="material-symbols-outlined mr-2 text-green-600">verified_user</span>
              Verification Status
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center text-sm font-medium">
                <span className={cn("material-symbols-outlined mr-3", profile.cacVerified ? 'text-green-600' : 'text-gray-300')}>check_circle</span>
                CAC Verified Business
              </div>
              <div className="flex items-center text-sm font-medium">
                <span className={cn("material-symbols-outlined mr-3", profile.addressVerified ? 'text-green-600' : 'text-gray-300')}>check_circle</span>
                Address Verified
              </div>
              <div className="flex items-center text-sm font-medium">
                <span className={cn("material-symbols-outlined mr-3", profile.bankVerified ? 'text-green-600' : 'text-gray-300')}>check_circle</span>
                Bank Verified Account
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-[1400px] ml-0 px-8 mt-12 border-b border-gray-200 dark:border-slate-800">
        <div className="flex gap-10">
          {(['products', 'discounts', 'reviews'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-4 px-2 font-bold text-lg transition-all capitalize",
                activeTab === tab ? "text-[#059669] border-b-2 border-[#059669]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-[1400px] ml-0 px-8 py-10 min-h-[400px]">
        {activeTab === 'products' && (
          <CatalogueGrid products={products} setSearchQuery={() => {}} setActiveCategory={() => {}} />
        )}

        {activeTab === 'discounts' && (
          <CatalogueGrid products={products.filter(p => (p as any).wholesaleDiscountPercent > 0)} setSearchQuery={() => {}} setActiveCategory={() => {}} />
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Buyer Feedback</h3>
                <p className="text-sm text-gray-500">Verified reviews from platform trades</p>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-700">
                <span className="text-2xl font-black">{profile.averageRating?.toFixed(1) || "5.0"}</span>
                <StarRating rating={profile.averageRating || 5} readOnly size="sm" />
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="py-20 text-center opacity-50 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                <p className="font-bold uppercase tracking-widest text-sm">No reviews yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                    <StarRating rating={rev.rating} readOnly size="sm" />
                    <p className="text-gray-600 dark:text-gray-400 italic">"{rev.comment || "Great products and service!"}"</p>
                    <div className="mt-auto text-[10px] font-bold uppercase tracking-widest text-gray-400">Verified Trade</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
