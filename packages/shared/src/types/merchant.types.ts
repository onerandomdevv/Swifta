import { VerificationStatus } from "../enums/verification-status.enum";
import { VerificationTier } from "../enums/verification-tier.enum";

export interface MerchantProfile {
  id: string;
  userId: string;
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
  bankAccountNo?: string;
  bankAccountName?: string;
  verificationTier: VerificationTier;
  verifiedAt?: Date;
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
  } | null;
  averageRating: number;
  reviewCount: number;
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
  bankAccountNo?: string;
  bankAccountName?: string;
}
