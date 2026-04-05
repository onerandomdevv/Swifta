"use client";

import { useAuth } from "@/providers/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isPublicDiscoveryRoute = /^\/(m|p)(?:\/|$)/.test(pathname);
    if (!isLoading && !user && !isPublicDiscoveryRoute) {
      router.replace("/login");
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-6">
          <div className="size-12 border-4 border-slate-200 border-t-navy-dark rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Verifying Session
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
