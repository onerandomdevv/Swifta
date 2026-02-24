"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "../../../components/layout/admin-header";
import { AdminSidebar } from "../../../components/layout/admin-sidebar";
import { useAuth } from "../../../providers/auth-provider";
import { useIdleTimeout } from "../../../hooks/use-idle-timeout";
import { toast } from "sonner";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  // Enforce 30-minute idle timeout for all staff
  useIdleTimeout(30, async () => {
    toast.error("Session expired due to inactivity.");
    await logout();
    router.push("/admin/login");
  });

  useEffect(() => {
    if (!isLoading) {
      if (!user || user.role !== "SUPER_ADMIN") {
        router.push("/admin/login");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "SUPER_ADMIN") return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-jakarta text-navy-dark dark:bg-slate-950 dark:text-white">
      {/* Sidebar Overlay for Mobile */}
      <AdminSidebar />

      {/* Main Content Area */}
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
