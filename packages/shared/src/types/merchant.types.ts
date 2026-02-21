import { VerificationStatus } from '../enums/verification-status.enum';

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
  warehouseLocation?: string;
  distributionCenter?: string;
  warehouseCapacity?: string;
  bankCode?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  verification: VerificationStatus;
  onboardingStep: number;
  createdAt: Date;
}

export interface UpdateMerchantDto {
  businessName?: string;
  businessType?: string;
  estYear?: string;
  category?: string;
  businessAddress?: string;
  cacNumber?: string;
  taxId?: string;
  warehouseLocation?: string;
  distributionCenter?: string;
  warehouseCapacity?: string;
  bankCode?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
}
