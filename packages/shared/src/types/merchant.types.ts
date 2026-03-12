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
  verifiedAt?: Date;
  lastSlugChangeAt?: Date;
  onboardingStep: number;
  createdAt: Date;
  dealsClosed?: number;
  responseTimeTotal?: number;
  quoteCount?: number;
  cacVerified: boolean;
  addressVerified: boolean;
  bankVerified: boolean;
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
  slugChangesCount?: number;
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
}
