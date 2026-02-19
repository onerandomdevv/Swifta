import type { ApiError } from '@hardware-os/shared';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type TokenGetter = () => string | null;
type TokenRefresher = () => Promise<boolean>;
type OnUnauthorized = () => void;

class ApiClient {
  private getToken: TokenGetter = () => null;
  private refreshTokenFn: TokenRefresher = async () => false;
  private onUnauthorized: OnUnauthorized = () => { };
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  /** Called by AuthProvider to wire up token access */
  configure(opts: {
    getToken: TokenGetter;
    refreshToken: TokenRefresher;
    onUnauthorized: OnUnauthorized;
  }) {
    this.getToken = opts.getToken;
    this.refreshTokenFn = opts.refreshToken;
    this.onUnauthorized = opts.onUnauthorized;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (res.ok) {
      const json = await res.json();
      // Unwrap { success, data } envelope
      if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
        return json.data as T;
      }
      return json as T;
    }

    const body = await res.json().catch(() => ({
      error: 'Unknown error',
      code: 'UNKNOWN',
      statusCode: res.status,
    }));

    const error: ApiError = {
      error: body.error || body.message || 'Request failed',
      code: body.code || 'UNKNOWN',
      statusCode: res.status,
    };

    throw error;
  }

  private async request<T>(path: string, options: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: this.getHeaders(),
    });

    // Handle 401 — attempt token refresh and retry once
    if (res.status === 401) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        // Retry with new token
        const retryRes = await fetch(`${BASE_URL}${path}`, {
          ...options,
          headers: this.getHeaders(),
        });
        return this.handleResponse<T>(retryRes);
      }
      // Refresh failed — redirect to login
      this.onUnauthorized();
      throw {
        error: 'Session expired',
        code: 'UNAUTHORIZED',
        statusCode: 401,
      } as ApiError;
    }

    return this.handleResponse<T>(res);
  }

  private async tryRefresh(): Promise<boolean> {
    // Deduplicate concurrent refresh calls
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }
    this.isRefreshing = true;
    this.refreshPromise = this.refreshTokenFn();
    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
