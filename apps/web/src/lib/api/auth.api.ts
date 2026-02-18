import { apiClient } from '../api-client';
import type { LoginDto, RegisterDto, RefreshTokenDto, ApiResponse, JwtPayload } from '@hardware-os/shared';

export async function login(dto: LoginDto): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: JwtPayload }>> {
  return apiClient.post('/auth/login', dto);
}

export async function register(dto: RegisterDto): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: JwtPayload }>> {
  return apiClient.post('/auth/register', dto);
}

export async function refresh(dto: RefreshTokenDto): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
  return apiClient.post('/auth/refresh', dto);
}

export async function logout(): Promise<ApiResponse<void>> {
  return apiClient.post('/auth/logout');
}
