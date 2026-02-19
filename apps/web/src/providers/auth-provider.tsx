'use client';

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
    type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { JwtPayload, UserRole } from '@hardware-os/shared';
import { authApi } from '@/lib/api/auth.api';
import { apiClient } from '@/lib/api-client';

interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    merchantId?: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (dto: {
        email: string;
        phone: string;
        password: string;
        role: UserRole;
        businessName?: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Store tokens in refs so they persist across renders but NOT in localStorage
    const accessTokenRef = useRef<string | null>(null);
    const refreshTokenRef = useRef<string | null>(null);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearAuth = useCallback(() => {
        accessTokenRef.current = null;
        refreshTokenRef.current = null;
        setUser(null);
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);

    const setTokens = useCallback((accessToken: string, refreshToken: string) => {
        accessTokenRef.current = accessToken;
        refreshTokenRef.current = refreshToken;
    }, []);

    const mapJwtToUser = (payload: JwtPayload): AuthUser => ({
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        merchantId: payload.merchantId,
    });

    const scheduleRefresh = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }
        refreshTimerRef.current = setTimeout(async () => {
            if (!refreshTokenRef.current) return;
            try {
                const res = await authApi.refresh(refreshTokenRef.current);
                setTokens(res.accessToken, res.refreshToken);
                scheduleRefresh();
            } catch {
                clearAuth();
                router.push('/login');
            }
        }, REFRESH_INTERVAL_MS);
    }, [setTokens, clearAuth, router]);

    // Attempt refresh on behalf of api-client (called on 401)
    const handleRefresh = useCallback(async (): Promise<boolean> => {
        if (!refreshTokenRef.current) return false;
        try {
            const res = await authApi.refresh(refreshTokenRef.current);
            setTokens(res.accessToken, res.refreshToken);
            scheduleRefresh();
            return true;
        } catch {
            clearAuth();
            return false;
        }
    }, [setTokens, clearAuth, scheduleRefresh]);

    // Wire up the API client with token access
    useEffect(() => {
        apiClient.configure({
            getToken: () => accessTokenRef.current,
            refreshToken: handleRefresh,
            onUnauthorized: () => {
                clearAuth();
                router.push('/login');
            },
        });
    }, [handleRefresh, clearAuth, router]);

    // On mount: no tokens in memory = user is logged out
    useEffect(() => {
        setIsLoading(false);
    }, []);

    const login = useCallback(
        async (email: string, password: string) => {
            const res = await authApi.login({ email, password });
            setTokens(res.accessToken, res.refreshToken);
            setUser(mapJwtToUser(res.user));
            scheduleRefresh();
        },
        [setTokens, scheduleRefresh],
    );

    const register = useCallback(
        async (dto: {
            email: string;
            phone: string;
            password: string;
            role: UserRole;
            businessName?: string;
        }) => {
            const res = await authApi.register(dto);
            setTokens(res.accessToken, res.refreshToken);
            setUser(mapJwtToUser(res.user));
            scheduleRefresh();
        },
        [setTokens, scheduleRefresh],
    );

    const logoutFn = useCallback(async () => {
        try {
            await authApi.logout();
        } catch {
            // Ignore errors on logout — clear local state regardless
        }
        clearAuth();
        router.push('/login');
    }, [clearAuth, router]);

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

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
