"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "../../../components/layout/admin-header";
import { SupportSidebar } from "../../../components/layout/support-sidebar";
import { useAuth } from "../../../providers/auth-provider";

export default function SupportDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user || user.role !== "SUPPORT") {
        router.push("/admin/login");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "SUPPORT") return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-jakarta text-navy-dark dark:bg-slate-950 dark:text-white">
      <SupportSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
