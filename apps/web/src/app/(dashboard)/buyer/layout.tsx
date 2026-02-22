"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NotificationCenter } from "@/components/layout/notification-center";
import { BuyerSidebar } from "@/components/layout/buyer-sidebar";
import { BuyerHeader } from "@/components/layout/buyer-header";
import { useAuth } from "@/providers/auth-provider";

export default function BuyerLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== "BUYER") {
      router.push("/merchant/dashboard");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      <BuyerHeader onOpenNotifications={() => setIsNotificationsOpen(true)} />

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <div className="flex pt-16 min-h-screen">
        <BuyerSidebar />

        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-[#111821] selection:bg-accent-orange/10 selection:text-accent-orange">
          <div className="p-6 lg:p-10 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
