'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { UserRole } from '@hardware-os/shared';

export default function Home() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isLoggedIn || !user) {
      router.replace('/login');
      return;
    }

    if (user.role === UserRole.MERCHANT) {
      router.replace('/merchant/dashboard');
    } else {
      router.replace('/buyer/dashboard');
    }
  }, [isLoading, isLoggedIn, user, router]);

  // Show a simple loading state while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">HARDWARE OS</h1>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
