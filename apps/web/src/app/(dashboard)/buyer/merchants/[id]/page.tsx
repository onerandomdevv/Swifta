"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPublicProfile } from "@/lib/api/merchant.api";
import { getPublicProductsByMerchant } from "@/lib/api/product.api";
import { getMerchantReviews } from "@/lib/api/review.api";
import type { MerchantProfile, Product, Review } from "@hardware-os/shared";
import { Button } from "@/components/ui/button";
import { CatalogueGrid } from "@/components/buyer/catalogue/catalogue-grid";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { StarRating } from "@/components/ui/star-rating";
import { useAuth } from "@/providers/auth-provider";
import { updateProfile, uploadDocument } from "@/lib/api/merchant.api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const DEFAULT_CATEGORY = "General Trade";

interface MetricRowProps {
  icon: string;
  label: string;
  isVerified: boolean;
}

function TrustMetricRow({ icon, label, isVerified }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-slate-400 text-lg">
          {icon}
        </span>
        <span className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-widest">
          {label}
        </span>
      </div>
      {isVerified ? (
        <span className="material-symbols-outlined text-green-500 text-xl font-bold rounded-full bg-green-500/10 p-1">
          check
        </span>
      ) : (
        <span className="material-symbols-outlined text-slate-300 text-xl font-bold bg-slate-100 dark:bg-slate-700 p-1 rounded-full">
          remove
        </span>
      )}
    </div>
  );
}

const DEFAULT_COVER = "https://images.unsplash.com/photo-1541888062141-94575badd5eb?q=80&w=2000&auto=format&fit=crop";

export default function BuyerMerchantProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [error, setError] = useState("");
  
  // Edit Mode States
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    businessName: "",
    description: "",
    profileImage: "",
    coverImage: "",
    socialLinks: {} as Record<string, string>
  });

  const profileInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  const isOwner = user?.role === "MERCHANT" && String(user?.merchantId) === String(id);

  const handleImageUpload = async (file: File, type: 'profile' | 'cover') => {
    try {
      const { url } = await uploadDocument(file);
      setEditForm(prev => ({
        ...prev,
        [type === 'profile' ? 'profileImage' : 'coverImage']: url
      }));
      toast.success(`${type === 'profile' ? 'Profile' : 'Cover'} image uploaded!`);
    } catch (err: any) {
      toast.error("Failed to upload image");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateProfile(editForm);
      setProfile(updated);
      setEditForm({
        businessName: updated.businessName,
        description: (updated as any).description || "",
        profileImage: updated.profileImage || "",
        coverImage: updated.coverImage || "",
        socialLinks: (updated as any).socialLinks || {}
      });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const resetEditForm = () => {
    if (!profile) return;
    setEditForm({
      businessName: profile.businessName,
      description: (profile as any).description || "",
      profileImage: (profile as any).profileImage || "",
      coverImage: (profile as any).coverImage || "",
      socialLinks: (profile as any).socialLinks || {}
    });
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setError("");
        setLoading(true);
        const profileData = await getPublicProfile(id as string);
        const productsData = await getPublicProductsByMerchant(id as string);
        if (active) {
          setProfile(profileData);
          setProducts(productsData as unknown as Product[]);
          // Initialize edit form
          setEditForm({
            businessName: profileData.businessName,
            description: (profileData as any).description || "",
            profileImage: (profileData as any).profileImage || "",
            coverImage: (profileData as any).coverImage || "",
            socialLinks: (profileData as any).socialLinks || {}
          });
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || "Failed to load merchant profile");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchData();
    }
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      setReviewsError(null);
      try {
        const reviewsData = await getMerchantReviews(id as string, 1, 10);
        if (active) setReviews(reviewsData);
      } catch (revErr: any) {
        console.error("Failed to load reviews:", revErr);
        if (active) setReviewsError("Failed to load reviews");
      } finally {
        if (active) setReviewsLoading(false);
      }
    };

    if (id) {
      fetchReviews();
    }
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Loading Trust Profile...
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-20 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-red-400">
          error
        </span>
        <h2 className="text-xl font-bold text-slate-900">Profile Not Found</h2>
        <p className="text-slate-500">
          {error || "This merchant profile could not be loaded."}
        </p>
        <Button onClick={() => router.back()} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900 animate-in fade-in duration-700">
      {/* Hero Header */}
      <div className="relative bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pb-8 sm:pb-12">
        <div 
          className="h-48 sm:h-64 w-full bg-slate-200 dark:bg-slate-800 bg-cover bg-center relative group overflow-hidden"
          style={{ 
            backgroundImage: `url('${(isEditing ? (editForm.coverImage || (profile as any).coverImage) : (profile as any).coverImage) || DEFAULT_COVER}')` 
          }}
        >
          {/* Gradient Overlay - Always at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-transparent h-48 sm:h-64 pointer-events-none z-0" />

          {/* Edit Overlay - Visible only when editing and hovered */}
          {isEditing && (
            <div 
              onClick={() => coverInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <div className="flex flex-col items-center text-white gap-2 pointer-events-none">
                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Change Cover</span>
              </div>
            </div>
          )}
          
          <input 
            type="file" 
            ref={coverInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'cover')}
          />
        </div>
        
        {/* Profile Content - Pulled up with negative margin, MUST be above banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative -mt-16 sm:-mt-20 z-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 text-center sm:text-left">
                {/* Profile Image with Squared/Circular logic */}
                <div className={`shrink-0 overflow-hidden border-4 border-white dark:border-slate-900 shadow-xl bg-white dark:bg-slate-800 relative group ${(profile.verificationTier === "VERIFIED" || profile.verificationTier === "TRUSTED") ? 'rounded-2xl size-28 sm:size-36' : 'rounded-full size-28 sm:size-36'}`}>
                  {((isEditing ? (editForm.profileImage || (profile as any).profileImage) : (profile as any).profileImage)) ? (
                    <img 
                      src={isEditing ? (editForm.profileImage || (profile as any).profileImage) : (profile as any).profileImage} 
                      alt={profile.businessName} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-5xl sm:text-6xl">
                        storefront
                      </span>
                    </div>
                  )}

                  {isEditing && (
                    <div 
                      onClick={() => profileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-white text-3xl">add_a_photo</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={profileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'profile')}
                  />
                </div>
                <div className="mb-2">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {isEditing ? (
                      <Input
                        value={editForm.businessName}
                        onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                        className="text-2xl sm:text-4xl font-black text-navy-dark dark:text-white uppercase tracking-tight h-auto py-1"
                      />
                    ) : (
                      <h1 className="text-2xl sm:text-4xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
                        {profile.businessName}
                      </h1>
                    )}
                    {profile.verificationTier === "VERIFIED" || profile.verificationTier === "TRUSTED" ? (
                      <span className="material-symbols-outlined text-blue-500 text-2xl sm:text-3xl filled select-none" title="Verified Business">
                        verified
                      </span>
                    ) : null}
                    {profile.verificationTier && (
                      <div className="scale-90 sm:scale-100 sm:origin-left ml-2">
                        <VerificationBadge tier={profile.verificationTier} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                      {profile.category || DEFAULT_CATEGORY} • EST.{" "}
                      {profile.estYear || "N/A"}
                    </p>
                    {(profile.averageRating ?? 0) > 0 && (
                      <div className="flex items-center gap-2 sm:pl-4 sm:border-l border-slate-200 dark:border-slate-800">
                        <StarRating
                          rating={profile.averageRating ?? 0}
                          readOnly
                          size="sm"
                        />
                        <span className="text-[10px] font-black text-navy-dark dark:text-white uppercase tracking-widest mt-0.5">
                          {profile.reviewCount} REVIEWS
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {isOwner && (
                <div className="flex gap-2 w-full lg:w-auto">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="font-black uppercase tracking-widest text-[11px] h-14 px-6 rounded-xl bg-green-600 hover:bg-green-700 active:scale-95 flex-1 lg:flex-none"
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        onClick={() => {
                          resetEditForm();
                          setIsEditing(false);
                        }}
                        variant="outline"
                        className="font-black uppercase tracking-widest text-[11px] h-14 px-6 rounded-xl active:scale-95 flex-1 lg:flex-none"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        resetEditForm();
                        setIsEditing(true);
                      }}
                      className="font-black uppercase tracking-widest text-[11px] h-14 px-6 rounded-xl bg-primary hover:bg-orange-600 active:scale-95 flex-1 lg:flex-none gap-2"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                      Edit Profile
                    </Button>
                  )}
                </div>
              )}
              {!isEditing && profile.contact?.phone && (
                <a
                  href={`https://wa.me/${profile.contact.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 h-14 px-6 bg-[#25D366] text-white font-black uppercase tracking-widest text-[11px] rounded-xl hover:opacity-90 transition-all shadow-lg shadow-green-500/10 active:scale-95 flex-1 lg:flex-none"
                >
                  <span className="material-symbols-outlined text-xl">
                    chat_bubble
                  </span>
                  WhatsApp
                </a>
              )}
              <div className="grid grid-cols-2 gap-3 flex-1 lg:flex-none">
                <Button
                  variant="outline"
                  className="font-black uppercase tracking-widest text-[11px] h-14 px-4 sm:px-6 rounded-xl border-slate-200 dark:border-slate-700 active:scale-95 gap-2"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: profile.businessName,
                        url: window.location.href,
                      }).catch(console.error);
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link copied to clipboard");
                    }
                  }}
                >
                  <span className="material-symbols-outlined text-lg">share</span>
                  Share
                </Button>
                <Button
                  className="font-black uppercase tracking-widest text-[11px] h-14 px-4 sm:px-6 rounded-xl shadow-lg shadow-primary/10 bg-primary hover:bg-orange-600 transition-all active:scale-95"
                  onClick={() => {
                    document
                      .getElementById("products-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Showcase
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12">
        {/* Profile Details Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Business Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
              <h2 className="text-xs sm:text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest sm:tracking-[0.2em] mb-6 sm:mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg sm:text-xl">
                  verified_user
                </span>
                Merchant Credentials
              </h2>

              {isEditing ? (
                <div className="space-y-4 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Business Description
                    </label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Tell your story... What makes your business unique?"
                      className="min-h-[120px] rounded-2xl"
                    />
                  </div>
                </div>
              ) : (profile as any).description && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-l-4 border-l-primary">
                  "{(profile as any).description}"
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 sm:gap-y-10 gap-x-12">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Business Type
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">
                    {profile.businessType || "Not Specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Industry
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {profile.category || DEFAULT_CATEGORY}
                  </p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Address
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    {profile.businessAddress || "Lagos, Nigeria"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Platform Trades
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-navy-dark dark:text-white">
                      {profile.dealsClosed || 0}+
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Member Since
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-navy-dark dark:text-white">
                      {new Date(profile.createdAt).getFullYear()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Trust Scorecard */}
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
              <h2 className="text-xs sm:text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest sm:tracking-[0.2em] mb-6 sm:mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg sm:text-xl">
                  shield_locked
                </span>
                Trust Scorecard
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TrustMetricRow 
                  icon="storefront" 
                  label="Business Address Verified" 
                  isVerified={(profile as any).addressVerified ?? false} 
                />
                <TrustMetricRow 
                  icon="corporate_fare" 
                  label="CAC Document Verified" 
                  isVerified={(profile as any).cacVerified ?? false} 
                />
                <TrustMetricRow 
                  icon="account_balance" 
                  label="Bank Account Matched" 
                  isVerified={(profile as any).bankVerified ?? false} 
                />
                <TrustMetricRow 
                  icon="handshake" 
                  label="Guarantor Verified" 
                  isVerified={(profile as any).guarantorVerified ?? false} 
                />
              </div>
            </div>

            {/* Social Hub - Added in V5 */}
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
              <h2 className="text-xs sm:text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest sm:tracking-[0.2em] mb-6 sm:mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg sm:text-xl">
                  public
                </span>
                Social Links & Hub
              </h2>

              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp URL</p>
                    <Input 
                      value={editForm.socialLinks.whatsapp || ""} 
                      onChange={(e) => setEditForm({...editForm, socialLinks: {...editForm.socialLinks, whatsapp: e.target.value}})}
                      placeholder="wa.me/..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instagram URL</p>
                    <Input 
                      value={editForm.socialLinks.instagram || ""} 
                      onChange={(e) => setEditForm({...editForm, socialLinks: {...editForm.socialLinks, instagram: e.target.value}})}
                      placeholder="instagram.com/..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">X (Twitter) URL</p>
                    <Input 
                      value={editForm.socialLinks.x || ""} 
                      onChange={(e) => setEditForm({...editForm, socialLinks: {...editForm.socialLinks, x: e.target.value}})}
                      placeholder="x.com/..."
                      className="rounded-xl"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {Object.entries(editForm.socialLinks).map(([platform, url]) => url && (
                    <a
                      key={platform}
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-primary/5 hover:border-primary/20 transition-all"
                    >
                      <span className="text-[10px] font-black text-navy-dark dark:text-white uppercase tracking-widest">
                        {platform}
                      </span>
                      <span className="material-symbols-outlined text-sm text-primary">open_in_new</span>
                    </a>
                  ))}
                  {Object.values(editForm.socialLinks).every(v => !v) && (
                    <p className="text-[11px] text-slate-400 font-medium italic">No social links added yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Logistics Overview */}
          {/* Logistics Overview */}
          <div className="space-y-6">
            <div className="bg-navy-dark dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] text-white shadow-xl border border-white/5">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest sm:tracking-[0.2em] mb-6 sm:mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  local_shipping
                </span>
                Logistics Capacity
              </h2>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-6 sm:gap-8">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white/60 text-lg">
                      warehouse
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                      Warehouse
                    </p>
                    <p className="text-[11px] sm:text-sm font-bold mt-0.5">
                      {profile.warehouseLocation || "Lagos, Nigeria"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white/60 text-lg">
                      hub
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                      Distribution
                    </p>
                    <p className="text-[11px] sm:text-sm font-bold mt-0.5">
                      {profile.distributionCenter || "Central Hub"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-[9px] font-medium text-white/40 leading-relaxed italic">
                  *Verified regularly by SwiftTrade agents.
                </p>
              </div>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
                  Buyer Feedback
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Recent trades with {profile.businessName}
                </p>
              </div>
              {(profile.averageRating ?? 0) > 0 && (
                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 w-fit">
                  <div className="text-right">
                    <p className="text-2xl font-black text-navy-dark dark:text-white leading-none">
                      {Number(profile.averageRating ?? 0).toFixed(1)}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Platform Rating
                    </p>
                  </div>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-12 text-center space-y-4 shadow-sm">
                <span className="material-symbols-outlined text-4xl text-slate-200">
                  rate_review
                </span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No verified reviews yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <StarRating rating={rev.rating} readOnly size="sm" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      "{rev.comment || "No comment provided."}"
                    </p>
                    <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-700/50 flex items-center gap-2">
                      <div className="size-5 bg-navy-dark/10 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[10px] text-navy-dark">
                          person
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-navy-dark dark:text-white uppercase tracking-widest">
                        Verified Buyer
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Products Section */}
        <section id="products-section" className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
                Product Showcase
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                Active listings available for immediate quote requests
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Available Items: {products.length}
              </span>
            </div>
          </div>

          <CatalogueGrid
            products={products}
            setSearchQuery={() => {}}
            setActiveCategory={() => {}}
          />
        </section>
      </div>
    </div>
  );
}
