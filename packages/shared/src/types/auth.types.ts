import { UserRole } from '../enums/user-role.enum';

export interface RegisterDto {
  email: string;
  phone: string;
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

export interface RefreshTokenDto {
  refreshToken: string;
}
