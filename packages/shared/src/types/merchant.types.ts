import { VerificationStatus } from "../enums/verification-status.enum";
import { VerificationTier } from "../enums/verification-tier.enum";

export interface MerchantProfile {
  id: string;
  userId: string;
  slug: string;
  businessName: string;
  businessType?: string;
  estYear?: string;
  category?: string;
  businessAddress?: string;
  cacNumber?: string;
  taxId?: string;
  cacDocumentUrl?: string;
  warehouseLocation?: string;
  distributionCenter?: string;
  warehouseCapacity?: string;
  bankCode?: string;
  bankAccountNumber?: string;
  settlementAccountName?: string;
  verificationTier: VerificationTier;
  tierUpgradedAt?: Date;
  verifiedAt?: Date;
  lastSlugChangeAt?: Date;
  onboardingStep: number;
  ninNumber?: string;
  maskedNin?: string;
  ninVerifiedAt?: Date;
  ninVerifiedVia?: string;
  cacVerifiedVia?: string;
  addressVerifiedVia?: string;
  createdAt: Date;
  dealsClosed?: number;
  responseTimeTotal?: number;

  cacVerified: boolean;
  addressVerified: boolean;
  bankVerified: boolean;
  ninVerified: boolean;
  fullName?: string;
  profilePhotoUrl?: string;
  contact?: {
    email: string;
    phone: string;
    emailVerified?: boolean;
  } | null;
  profileImage?: string;
  coverImage?: string;
  averageRating?: number;
  reviewCount: number;
  followersCount?: number;
  description?: string;
  socialLinks?: Record<string, string>;
  websiteUrl?: string;
  slugChangesCount?: number;
  notificationPreferences?: Record<string, any>;
}

export interface UpdateMerchantDto {
  businessName?: string;
  businessType?: string;
  estYear?: string;
  category?: string;
  businessAddress?: string;
  cacNumber?: string;
  taxId?: string;
  cacDocumentUrl?: string;
  warehouseLocation?: string;
  distributionCenter?: string;
  warehouseCapacity?: string;
  bankCode?: string;
  bankAccountNumber?: string;
  settlementAccountName?: string;
  profileImage?: string;
  coverImage?: string;
  description?: string;
  socialLinks?: Record<string, string>;
  websiteUrl?: string;
}
