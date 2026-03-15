"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { merchantApi } from "@/lib/api/merchant.api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StateLgaSelector } from "@/components/ui/state-lga-selector";
import type { MerchantProfile, UpdateMerchantDto } from "@hardware-os/shared";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MerchantProfile;
  onSuccess: (updatedProfile: MerchantProfile) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onSuccess,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<UpdateMerchantDto>({
    businessName: profile.businessName,
    businessAddress: profile.businessAddress || "",
    description: profile.description || "",
    profileImage: profile.profileImage || "",
    coverImage: profile.coverImage || "",
    websiteUrl: profile.websiteUrl || "",
    socialLinks: profile.socialLinks || {},
  });

  const [streetAddress, setStreetAddress] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<"profile" | "cover" | null>(null);

  React.useEffect(() => {
    if (profile.businessAddress) {
      const parts = profile.businessAddress.split(",").map(p => p.trim());
      if (parts.length >= 3) {
        setStreetAddress(parts.slice(0, parts.length - 2).join(", "));
        setLga(parts[parts.length - 2]);
        setState(parts[parts.length - 1]);
      } else if (parts.length === 2) {
        setStreetAddress(parts[0]);
        setLga("");
        setState(parts[1]);
      } else {
        setStreetAddress(profile.businessAddress);
      }
    }
  }, [profile.businessAddress]);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(type);
    try {
      const { url } = await merchantApi.uploadDocument(file);
      setFormData((prev) => ({
        ...prev,
        [type === "profile" ? "profileImage" : "coverImage"]: url,
      }));
      toast.success(`${type === "profile" ? "Profile" : "Cover"} image uploaded`);
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const finalAddress = streetAddress 
        ? `${streetAddress}${lga ? `, ${lga}` : ""}${state ? `, ${state}` : ""}`
        : "";
      
      const updatedProfile = await merchantApi.updateProfile({
        ...formData,
        businessAddress: finalAddress
      });
      toast.success("Profile updated successfully!");
      onSuccess(updatedProfile);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Store Profile"
      description="Update your business identity and presence on Swifta."
      className="relative bg-surface border border-border rounded-[2.5rem] shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Images Selection */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Profile Image */}
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase text-foreground-muted tracking-widest px-1">
                Store Logo
              </label>
              <div 
                onClick={() => profileInputRef.current?.click()}
                className="group relative h-40 rounded-3xl border-2 border-dashed border-border hover:border-primary transition-all cursor-pointer overflow-hidden bg-background-secondary/50 flex flex-col items-center justify-center gap-2"
              >
                {formData.profileImage ? (
                  <>
                    <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">
                      Change Logo
                    </div>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-3xl text-foreground-muted group-hover:text-primary transition-colors">add_a_photo</span>
                    <span className="text-[10px] font-bold text-foreground-muted">Upload Logo</span>
                  </>
                )}
                {uploadingImage === "profile" && (
                   <div className="absolute inset-0 bg-surface/80 flex items-center justify-center z-10">
                     <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                   </div>
                )}
              </div>
              <input 
                type="file" 
                ref={profileInputRef} 
                onChange={(e) => handleImageUpload(e, "profile")} 
                className="hidden" 
                accept="image/*"
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase text-foreground-muted tracking-widest px-1">
                Store Banner
              </label>
              <div 
                onClick={() => coverInputRef.current?.click()}
                className="group relative h-40 rounded-3xl border-2 border-dashed border-border hover:border-primary transition-all cursor-pointer overflow-hidden bg-background-secondary/50 flex flex-col items-center justify-center gap-2"
              >
                {formData.coverImage ? (
                  <>
                    <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">
                      Change Banner
                    </div>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-3xl text-foreground-muted group-hover:text-primary transition-colors">add_photo_alternate</span>
                    <span className="text-[10px] font-bold text-foreground-muted">Upload Banner</span>
                  </>
                )}
                 {uploadingImage === "cover" && (
                   <div className="absolute inset-0 bg-surface/80 flex items-center justify-center z-10">
                     <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                   </div>
                )}
              </div>
              <input 
                type="file" 
                ref={coverInputRef} 
                onChange={(e) => handleImageUpload(e, "cover")} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>
        </div>

        {/* Text Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-foreground-muted tracking-widest px-1">
              Business Name
            </label>
            <Input
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Your business name"
              className="h-14 rounded-2xl border-border bg-background-secondary focus:ring-primary/20"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-black uppercase text-foreground-muted tracking-widest">
                Store Description
              </label>
              <span className={cn(
                "text-[10px] font-bold tracking-widest",
                (formData.description?.length || 0) >= 150 ? "text-red-500" : "text-foreground-muted"
              )}>
                {formData.description?.length || 0}/160
              </span>
            </div>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={160}
              placeholder="Tell customers what you sell..."
              className="min-h-[100px] rounded-2xl border-border bg-background-secondary focus:ring-primary/20"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase text-foreground-muted tracking-widest px-1">
              Business Location
            </label>
            <Input
              name="streetAddress"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="Full Street Address"
              className="h-14 rounded-2xl border-border bg-background-secondary focus:ring-primary/20"
            />
            <StateLgaSelector 
              selectedState={state}
              selectedLga={lga}
              onStateChange={setState}
              onLgaChange={setLga}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-foreground-muted tracking-widest px-1">
                  Website URL
                </label>
                <Input
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://yourbusiness.com"
                  className="h-12 rounded-xl border-border bg-background-secondary/50"
                />
              </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 pb-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 active:scale-95 transition-all"
            disabled={isLoading}
          >
            {isLoading ? "Saving Changes..." : "Save Profile Details"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
