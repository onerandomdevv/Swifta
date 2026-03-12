"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserRole } from "@hardware-os/shared";
import type { LoginDto, RegisterDto } from "@hardware-os/shared";
import { authApi } from "../lib/api/auth.api";
import { apiClient } from "../lib/api-client";

interface User {
  id: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  role: UserRole;
  emailVerified: boolean;
  isWhatsAppLinked?: boolean;
  merchantId?: string;
  supplierId?: string;
  buyerType?: "CONSUMER";
  supplierProfile?: {
    companyName: string;
    companyAddress: string;
    cacNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  internalLogin: (identifier: string, password: string) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  initiateWhatsAppLogin: (phone: string) => Promise<void>;
  verifyWhatsAppLogin: (phone: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isLoggingOut = useRef(false);

  // Routes where we should NOT redirect to /login on auth failure
  const isPublicAuthRoute =
    /^\/(login|register|admin\/login|admin\/join|admin\/verify)(?:\/|$)/.test(
      pathname,
    );

  const clearAuth = useCallback(() => {
    setUser(null);
  }, []);

  const handleRefresh = useCallback(async (): Promise<boolean> => {
    // Don't attempt refresh if we're intentionally logging out
    if (isLoggingOut.current) return false;
    try {
      await authApi.refresh(); // The HttpOnly cookie is securely attached automatically
      return true;
    } catch (error) {
      clearAuth();
      if (!isPublicAuthRoute) {
        router.push("/login");
      }
      return false;
    }
  }, [router, clearAuth, isPublicAuthRoute]);

  // Configure apiClient
  useEffect(() => {
    apiClient.configure({
      refreshToken: handleRefresh,
      onUnauthorized: () => {
        clearAuth();
        if (!isPublicAuthRoute) {
          router.push("/login");
        }
      },
    });
  }, [handleRefresh, clearAuth, router]);

  const login = async (identifier: string, password: string) => {
    const response = await authApi.login({ identifier, password });
    setUser(response.user);
  };

  const internalLogin = async (identifier: string, password: string) => {
    // Note for backend: verify internalLogin attaches HttpOnly cookies just like login
    const response = await authApi.internalLogin({ identifier, password });
    setUser(response.user);
  };

  const register = async (dto: RegisterDto) => {
    const response = await authApi.register(dto);
    setUser(response.user);
  };

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me();
      setUser(response.user);
    } catch (e) {
      // silently fail — user stays as-is
    }
  }, []);

  const logoutFn = useCallback(async () => {
    isLoggingOut.current = true;
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      router.push("/login");
    }
  }, [clearAuth, router]);

  const initiateWhatsAppLogin = async (phone: string) => {
    await authApi.initiateWhatsAppLogin(phone);
  };

  const verifyWhatsAppLogin = async (phone: string, code: string) => {
    const response = await authApi.verifyWhatsAppLogin(phone, code);
    setUser(response.user);
  };

  // Initial check for session via HttpOnly cookies
  useEffect(() => {
    let mounted = true;
    const fetchMe = async () => {
      if (isLoggingOut.current) return;
      try {
        const response = await authApi.me();
        if (mounted && !isLoggingOut.current) {
          setUser(response.user);
        }
      } catch (e) {
        if (mounted) {
          clearAuth();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Automatically fetch /me to hydrate session, no localStorage used!
    fetchMe();

    return () => {
      mounted = false;
    };
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        internalLogin,
        register,
        logout: logoutFn,
        refreshUser,
        initiateWhatsAppLogin,
        verifyWhatsAppLogin,
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
