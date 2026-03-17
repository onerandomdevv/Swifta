import type { ApiResponse, ApiError } from "@swifta/shared";
import { bigIntReviver, bigIntReplacer } from "@swifta/shared";

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
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
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

    let url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const performRequest = async (): Promise<Response> => {
      return fetch(url, { ...options, headers, credentials: "include" });
    };

    let response = await performRequest();

    // Handle 401 Unauthorized - Attempt Token Refresh
    if (
      response.status === 401 &&
      this.refreshToken &&
      !endpoint.includes("/auth/login") &&
      !endpoint.includes("/auth/refresh")
    ) {
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

    const text = await response.text();
    if (!text) return {} as T;

    const result = JSON.parse(text, bigIntReviver) as ApiResponse<T>;
    return result.data;
  }

  private async handleError(response: Response): Promise<Error & ApiError> {
    try {
      const errorData = await response.json();

      let detailedMessage =
        typeof errorData.message === "string"
          ? errorData.message
          : Array.isArray(errorData.message)
            ? errorData.message.join(", ")
            : null;

      const errorString = detailedMessage || (typeof errorData.error === "string" ? errorData.error : "An unexpected error occurred");
      
      const err = new Error(errorString) as Error & ApiError;
      err.error = errorString;
      err.code = errorData.code || "UNKNOWN_ERROR";
      err.statusCode = response.status;
      return err;
    } catch {
      const err = new Error(response.statusText || "An unexpected error occurred") as Error & ApiError;
      err.error = err.message;
      err.code = "HTTP_ERROR";
      err.statusCode = response.status;
      return err;
    }
  }

  async requestPaginated<T>(endpoint: string, config: RequestConfig = {}): Promise<any> {
    const { params, ...options } = config;

    let url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const performRequest = async (): Promise<Response> => {
      return fetch(url, { ...options, headers, credentials: "include" });
    };

    let response = await performRequest();

    // Handle 401 Unauthorized - Attempt Token Refresh
    if (
      response.status === 401 &&
      this.refreshToken &&
      !endpoint.includes("/auth/login") &&
      !endpoint.includes("/auth/refresh")
    ) {
      if (this.isRefreshing) {
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

    const text = await response.text();
    if (!text) return { data: [], meta: { total: 0, page: 1, limit: 10 } };

    return JSON.parse(text, bigIntReviver);
  }

  get<T>(endpoint: string, config?: RequestConfig) {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }

  getPaginated<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T[]> & { meta: any }> {
    return this.requestPaginated<T>(endpoint, { ...config, method: "GET" });
  }

  post<T>(endpoint: string, body?: any, config?: RequestConfig) {
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body, bigIntReplacer),
    });
  }

  patch<T>(endpoint: string, body?: any, config?: RequestConfig) {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body, bigIntReplacer),
    });
  }

  put<T>(endpoint: string, body?: any, config?: RequestConfig) {
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body, bigIntReplacer),
    });
  }

  delete<T>(endpoint: string, config?: RequestConfig) {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }

  async download(endpoint: string, config: RequestConfig = {}): Promise<Blob> {
    const { params, ...options } = config;
    let url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    const headers = new Headers(options.headers);
    const response = await fetch(url, { ...options, headers, credentials: "include", method: "GET" });
    if (!response.ok) throw await this.handleError(response);
    return response.blob();
  }
}

export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
);
