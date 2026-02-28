import { VerificationStatus } from "../enums/verification-status.enum";

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
  verification: VerificationStatus;
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
