import { VerificationStatus } from '../enums/verification-status.enum';

export interface MerchantProfile {
  id: string;
  userId: string;
  businessName: string;
  businessAddress?: string;
  cacNumber?: string;
  bankCode?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  verification: VerificationStatus;
  onboardingStep: number;
  createdAt: Date;
}

export interface UpdateMerchantDto {
  businessName?: string;
  businessAddress?: string;
  cacNumber?: string;
  bankCode?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
}
