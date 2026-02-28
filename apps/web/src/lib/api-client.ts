import type { ApiResponse, ApiError } from '@hardware-os/shared';

type RequestConfig = RequestInit & {
  params?: Record<string, string>;
};

class ApiClient {
  private baseUrl: string;
  private refreshToken: (() => Promise<boolean>) | null = null;
  private onUnauthorized: (() => void) | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((success: boolean) => void)[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  configure(config: {
    refreshToken: () => Promise<boolean>;
    onUnauthorized: () => void;
  }) {
    this.refreshToken = config.refreshToken;
    this.onUnauthorized = config.onUnauthorized;
  }

  private subscribeTokenRefresh(cb: (success: boolean) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onTokenRefreshed(success: boolean) {
    this.refreshSubscribers.forEach((cb) => {
      cb(success);
    });
    this.refreshSubscribers = [];
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, ...options } = config;

    let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const performRequest = async (): Promise<Response> => {
      return fetch(url, { ...options, headers, credentials: 'include' });
    };

    let response = await performRequest();

    // Handle 401 Unauthorized - Attempt Token Refresh
    if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      if (this.isRefreshing) {
        // Wait for current refresh to complete
        const success = await new Promise<boolean>((resolve) => {
          this.subscribeTokenRefresh((s) => resolve(s));
        });

        if (success) {
          response = await performRequest();
        }
      } else {
        this.isRefreshing = true;
        try {
          const success = await this.refreshToken();
          this.isRefreshing = false;
          this.onTokenRefreshed(success);

          if (success) {
            response = await performRequest();
          } else {
            this.onUnauthorized?.();
            throw await this.handleError(response);
          }
        } catch (error) {
          this.isRefreshing = false;
          this.onTokenRefreshed(false);
          this.onUnauthorized?.();
          throw error;
        }
      }
    }

    if (!response.ok) {
      throw await this.handleError(response);
    }

    // Unwrapping the { success, data } envelope
    // Note: this discards `meta` for pagination! If components need pagination later, 
    // a separate `getPaginated` method must be added to ApiClient.
    const text = await response.text();
    if (!text) return {} as T;
    
    const result = JSON.parse(text) as ApiResponse<T>;
    return result.data;
  }

  private async handleError(response: Response): Promise<ApiError> {
    try {
      const errorData = await response.json();
      
      // NestJS often puts the descriptive human-readable error in 'message'
      // It can be a string, or an array of strings for validation errors.
      let detailedMessage = typeof errorData.message === 'string' 
        ? errorData.message 
        : Array.isArray(errorData.message) 
          ? errorData.message[0] 
          : null;

      return {
        error: detailedMessage || errorData.error || 'An unexpected error occurred',
        code: errorData.code || 'UNKNOWN_ERROR',
        statusCode: response.status,
      } as ApiError;
    } catch {
      return {
        error: response.statusText || 'An unexpected error occurred',
        code: 'HTTP_ERROR',
        statusCode: response.status,
      } as ApiError;
    }
  }

  get<T>(endpoint: string, config?: RequestConfig) {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, config?: RequestConfig) {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body, (key, value) =>
        typeof value === 'bigint' ? Number(value) : value
      ),
    });
  }

  patch<T>(endpoint: string, body?: any, config?: RequestConfig) {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body, (key, value) =>
        typeof value === 'bigint' ? Number(value) : value
      ),
    });
  }

  delete<T>(endpoint: string, config?: RequestConfig) {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
);
