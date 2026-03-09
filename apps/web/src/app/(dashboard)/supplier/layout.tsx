"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NotificationCenter } from "@/components/layout/notification-center";
import { SupplierSidebar } from "@/components/layout/supplier-sidebar";
import { SupplierHeader } from "@/components/layout/supplier-header";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { useAuth } from "@/providers/auth-provider";

export default function SupplierLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user && user.role !== "SUPPLIER") {
      if (user.role === "MERCHANT") {
        router.push("/merchant/dashboard");
      } else if (user.role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/buyer/dashboard");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "SUPPLIER") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900">
      <SupplierSidebar />

      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <SupplierSidebar variant="mobile" />
      </MobileDrawer>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <SupplierHeader
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onMenuClick={() => setIsDrawerOpen(true)}
        />

        <NotificationCenter
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background-light dark:bg-[#14171e]">
          {children}
        </main>
      </div>
    </div>
  );
}
