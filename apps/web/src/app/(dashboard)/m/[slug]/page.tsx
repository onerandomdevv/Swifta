"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { merchantApi } from "@/lib/api/merchant.api";
import { MerchantProfileView } from "@/components/merchant/profile/merchant-profile-view";
import type { MerchantProfile } from "@twizrr/shared";

export default function SlugProfilePage() {
  const { slug } = useParams();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    const fetchBySlug = async () => {
      try {
        const data = await merchantApi.lookupBySlug(slug as string);
        setProfile(data);
      } catch (err: any) {
        setError(err.message || "Merchant not found");
      } finally {
        setLoading(false);
      }
    };

    fetchBySlug();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center">Locating @{slug}...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-20 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <h2 className="text-xl font-bold text-slate-900">Profile Not Found</h2>
        <p className="text-slate-500">The business "@{slug}" could not be found.</p>
      </div>
    );
  }

  return <MerchantProfileView initialMerchant={profile} />;
}
