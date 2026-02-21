import { UserRole } from '../enums/user-role.enum';

export interface RegisterDto {
  email: string;
  phone: string;
  fullName?: string;
  password: string;
  businessName?: string;
  role: UserRole;
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
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  merchantId?: string;
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