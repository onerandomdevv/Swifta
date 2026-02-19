import { apiClient } from '../api-client';
import type { LoginDto, RegisterDto, JwtPayload } from '@hardware-os/shared';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: JwtPayload;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login(dto: LoginDto): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', dto);
  },

  register(dto: RegisterDto): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', dto);
  },

  refresh(refreshToken: string): Promise<RefreshResponse> {
    return apiClient.post<RefreshResponse>('/auth/refresh', { refreshToken });
  },

  logout(): Promise<void> {
    return apiClient.post<void>('/auth/logout');
  },
};
