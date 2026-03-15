"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BuyerSidebar } from "@/components/layout/buyer-sidebar";
import { MerchantSidebar } from "@/components/layout/merchant-sidebar";
import { BuyerHeader } from "@/components/layout/buyer-header";
import { BuyerMobileNav } from "@/components/layout/buyer-mobile-nav";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { useAuth } from "@/providers/auth-provider";

export default function BuyerLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    // Allow any role to view public merchant profiles, product details, and the catalogue
    if (
      pathname.startsWith("/buyer/merchants/") || 
      pathname.startsWith("/buyer/products/") ||
      pathname.startsWith("/buyer/catalogue")
    ) {
      return;
    }

    if (user && user.role !== "BUYER") {
      switch (user.role) {
        case "SUPPLIER":
          router.push("/supplier/dashboard");
          break;
        case "SUPER_ADMIN":
          router.push("/admin/dashboard");
          break;
        case "MERCHANT":
          router.push("/merchant/dashboard");
          break;
        case "OPERATOR":
        case "SUPPORT":
          router.push("/admin/dashboard");
          break;
        default:
          router.push("/buyer/catalogue");
      }
    }
  }, [user, router, pathname]);

  const Sidebar = user?.role === "MERCHANT" ? MerchantSidebar : BuyerSidebar;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background-light font-display text-slate-900 selection:bg-primary/10 selection:text-primary">
      <Sidebar />

      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <Sidebar variant="mobile" />
      </MobileDrawer>

      <main className="flex-1 overflow-x-hidden overflow-y-auto pb-20 lg:pb-0 h-screen">
        <BuyerHeader onMenuClick={() => setIsDrawerOpen(true)} />

        <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>

      <BuyerMobileNav />
    </div>
  );
}
