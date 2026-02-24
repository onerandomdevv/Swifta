import { UserRole } from '@hardware-os/shared';
import type {
  LoginDto,
  RegisterDto,
  TokenPair
} from '@hardware-os/shared';
import { apiClient } from '../api-client';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName?: string;
    role: UserRole;
    emailVerified: boolean;
    merchantId?: string;
  };
}

export const authApi = {
  login: (dto: LoginDto) =>
    apiClient.post<AuthResponse>('/auth/login', dto),

  internalLogin: (dto: LoginDto) =>
    apiClient.post<AuthResponse>('/auth/internal/login', dto),

  register: (dto: RegisterDto) =>
    apiClient.post<AuthResponse>('/auth/register', dto),

  adminRegister: (dto: Record<string, any>) =>
    apiClient.post<{ message: string }>('/auth/internal/register', dto),

  verifyEmail: (dto: { email: string; code: string }) =>
    apiClient.post<{ message: string }>('/auth/verify-email', dto),

  resendVerification: (dto: { email: string }) =>
    apiClient.post<{ message: string }>('/auth/resend-verification', dto),

  refresh: () =>
    apiClient.post<TokenPair>('/auth/refresh'),

  logout: () =>
    apiClient.post<void>('/auth/logout'),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }),

  me: () =>
    apiClient.get<{ user: AuthResponse['user'] }>('/auth/me'),

  resetPassword: (dto: { token: string; newPassword: string }) =>
    apiClient.post<{ message: string }>('/auth/reset-password', dto),

  verifyStaffToken: (token: string) =>
    apiClient.post<{ verified: boolean }>('/auth/internal/verify-token', { token }),
};
