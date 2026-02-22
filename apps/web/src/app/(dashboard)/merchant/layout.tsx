"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NotificationCenter } from "@/components/layout/notification-center";
import { MerchantSidebar } from "@/components/layout/merchant-sidebar";
import { MerchantHeader } from "@/components/layout/merchant-header";
import { useAuth } from "@/providers/auth-provider";

export default function MerchantLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== "MERCHANT") {
      router.push("/buyer/dashboard");
    }
  }, [user, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900">
      <MerchantSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MerchantHeader
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        <NotificationCenter
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-[#14171e]">
          {children}
        </main>
      </div>
    </div>
  );
}
