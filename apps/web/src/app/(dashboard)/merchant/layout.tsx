"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NotificationCenter } from "@/components/layout/notification-center";
import { MerchantSidebar } from "@/components/layout/merchant-sidebar";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { useAuth } from "@/providers/auth-provider";

export default function MerchantLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== "MERCHANT") {
      if (user.role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/buyer/dashboard");
      }
    }
  }, [user, router]);

  // Block merchant UI rendering if user is not a merchant
  if (!user || user.role !== "MERCHANT") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900">
      <MerchantSidebar />

      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <MerchantSidebar variant="mobile" />
      </MobileDrawer>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
