import { UserRole } from '@hardware-os/shared';
import type {
  LoginDto,
  RegisterDto,
  TokenPair
} from '@hardware-os/shared';
import { apiClient } from '../api-client';

export interface AuthResponse extends TokenPair {
  user: {
    id: string;
    email: string;
    role: UserRole;
    merchantId?: string;
  };
}

export const authApi = {
  login: (dto: LoginDto) =>
    apiClient.post<AuthResponse>('/auth/login', dto),

  register: (dto: RegisterDto) =>
    apiClient.post<AuthResponse>('/auth/register', dto),

  refresh: (refreshToken: string) =>
    apiClient.post<TokenPair>('/auth/refresh', { refreshToken }),

  logout: () =>
    apiClient.post<void>('/auth/logout'),
};
