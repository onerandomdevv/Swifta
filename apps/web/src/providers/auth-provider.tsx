"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@hardware-os/shared";
import type { LoginDto, RegisterDto } from "@hardware-os/shared";
import { authApi } from "../lib/api/auth.api";
import { apiClient } from "../lib/api-client";

interface User {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  merchantId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearAuth = useCallback(() => {
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    setUser(null);
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
  }, []);

  const scheduleRefresh = useCallback((expiresInMinutes: number = 14) => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);

    // Refresh 1 minute before expiry (assuming 15m default expiry)
    refreshTimeoutRef.current = setTimeout(
      () => {
        handleRefresh();
      },
      expiresInMinutes * 60 * 1000,
    );
  }, []);

  const handleRefresh = useCallback(async (): Promise<string | null> => {
    if (!refreshTokenRef.current) {
      clearAuth();
      return null;
    }

    try {
      const tokens = await authApi.refresh(refreshTokenRef.current);
      accessTokenRef.current = tokens.accessToken;
      refreshTokenRef.current = tokens.refreshToken;
      scheduleRefresh();
      return tokens.accessToken;
    } catch (error) {
      clearAuth();
      router.push("/login");
      return null;
    }
  }, [router, scheduleRefresh, clearAuth]);

  // Configure apiClient
  useEffect(() => {
    apiClient.configure({
      getToken: () => accessTokenRef.current,
      refreshToken: handleRefresh,
      onUnauthorized: () => {
        clearAuth();
        router.push("/login");
      },
    });
  }, [handleRefresh, clearAuth, router]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    accessTokenRef.current = response.accessToken;
    refreshTokenRef.current = response.refreshToken;
    setUser(response.user);
    scheduleRefresh();
  };

  const register = async (dto: RegisterDto) => {
    const response = await authApi.register(dto);
    accessTokenRef.current = response.accessToken;
    refreshTokenRef.current = response.refreshToken;
    setUser(response.user);
    scheduleRefresh();
  };

  const logoutFn = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      router.push("/login");
    }
  }, [clearAuth, router]);

  // Initial check could go here if we used cookies for persistence (but rules say memory only)
  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        register,
        logout: logoutFn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
