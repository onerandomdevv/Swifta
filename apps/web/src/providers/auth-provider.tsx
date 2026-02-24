"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
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
  internalLogin: (email: string, password: string) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const clearAuth = useCallback(() => {
    setUser(null);
  }, []);

  const handleRefresh = useCallback(async (): Promise<boolean> => {
    try {
      await authApi.refresh(''); // The cookie is sent automatically, so payload can be empty string
      return true;
    } catch (error) {
      clearAuth();
      router.push("/login");
      return false;
    }
  }, [router, clearAuth]);

  // Configure apiClient
  useEffect(() => {
    apiClient.configure({
      refreshToken: handleRefresh,
      onUnauthorized: () => {
        clearAuth();
        router.push("/login");
      },
    });
  }, [handleRefresh, clearAuth, router]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setUser(response.user);
  };

  const internalLogin = async (email: string, password: string) => {
    // Note for backend: verify internalLogin attaches HttpOnly cookies just like login
    const response = await authApi.internalLogin({ email, password });
    setUser(response.user);
  };

  const register = async (dto: RegisterDto) => {
    const response = await authApi.register(dto);
    setUser(response.user);
  };

  const logoutFn = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      router.push("/login");
    }
  }, [clearAuth, router]);

  // Initial check for session via HttpOnly cookies
  useEffect(() => {
    let mounted = true;
    const fetchMe = async () => {
      try {
        const response = await authApi.me();
        if (mounted) {
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
    
    return () => { mounted = false; };
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
