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
  emailVerified: boolean;
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

const SESSION_KEY = "__hwos_session";

function persistSession(access: string, refresh: string, user: User) {
  if (typeof window !== "undefined") {
    try {
      const payload = btoa(encodeURIComponent(JSON.stringify({ a: access, r: refresh, u: user })));
      localStorage.setItem(SESSION_KEY, payload);
    } catch (e) {
      console.error("Failed to persist session");
    }
  }
}

function getPersistedSession(): { access: string; refresh: string; user: User } | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(decodeURIComponent(atob(stored)));
        if (parsed.a && parsed.r && parsed.u) {
          return { access: parsed.a, refresh: parsed.r, user: parsed.u };
        }
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

function updatePersistedTokens(access: string, refresh: string) {
  const current = getPersistedSession();
  if (current) {
    persistSession(access, refresh, current.user);
  }
}

function clearPersistedSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
    // Cleanup old keys just in case
    localStorage.removeItem("auth_access");
    localStorage.removeItem("auth_refresh");
    localStorage.removeItem("auth_user");
  }
}

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
    clearPersistedSession();
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
      updatePersistedTokens(tokens.accessToken, tokens.refreshToken);
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
    persistSession(response.accessToken, response.refreshToken, response.user);
    scheduleRefresh();
  };

  const register = async (dto: RegisterDto) => {
    const response = await authApi.register(dto);
    accessTokenRef.current = response.accessToken;
    refreshTokenRef.current = response.refreshToken;
    setUser(response.user);
    persistSession(response.accessToken, response.refreshToken, response.user);
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

  // Initial check for persistence
  useEffect(() => {
    const session = getPersistedSession();
    if (session) {
      setUser(session.user);
      accessTokenRef.current = session.access;
      refreshTokenRef.current = session.refresh;
      scheduleRefresh();
    } else {
      clearAuth(); // Only run if it's explicitly cleared or missing, though typically we just don't do anything
    }
    setIsLoading(false);
  }, [scheduleRefresh, clearAuth]);

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
