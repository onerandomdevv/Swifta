import { UserRole } from "../enums/user-role.enum";

export interface RegisterDto {
  email: string;
  phone: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  password: string;
  businessName?: string;
  companyName?: string;
  companyAddress?: string;
  cacNumber?: string;
  role: UserRole;
  buyerType?: "BUSINESS" | "CONSUMER";
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  merchantId?: string;
  supplierId?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role: UserRole;
  merchantId?: string;
  supplierId?: string;
}

export interface AuthResponse extends TokenPair {
  user: AuthenticatedUser;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
}
