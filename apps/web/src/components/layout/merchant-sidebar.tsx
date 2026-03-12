"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { getDisplayName } from "@hardware-os/shared";
import { Logo } from "@/components/ui/logo";
import { WhatsAppLinkStatus } from "@/components/dashboard/whatsapp-link-status";

export function MerchantSidebar({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const isDesktop = variant === "desktop";

  const navItems = [
    { label: "Dashboard", icon: "grid_view", href: "/merchant/dashboard" },
    {
      label: "Business Page",
      icon: "storefront",
      href: `/buyer/merchants/${user?.merchantId}`,
    },
    { label: "Orders", icon: "format_list_bulleted", href: "/merchant/orders" },
    { label: "Notifications", icon: "notifications", href: "/merchant/notifications" },
    {
      label: "Products & Stock",
      icon: "inventory_2",
      href: "/merchant/products",
    },
    {
      label: "Buy Wholesale",
      icon: "factory",
      href: "/merchant/wholesale",
      isComingSoon: true,
    },
    {
      label: "Trade Financing",
      icon: "sell",
      href: "/merchant/trade-financing",
      isComingSoon: true,
    },
    { label: "Payouts", icon: "wallet", href: "/merchant/payouts" },
    {
      label: "Verification",
      icon: "verified_user",
      href: "/merchant/verification",
    },
    { label: "Settings", icon: "settings", href: "/merchant/settings" },
  ];

  return (
    <aside
      className={`${isDesktop ? "hidden lg:flex w-64 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen" : "flex w-full"} flex-col bg-white dark:bg-slate-900 shrink-0 z-50`}
    >
      {isDesktop && (
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-3">
          <Link href="/merchant/dashboard" className="flex items-center gap-3">
            <Logo variant="light" size="sm" className="h-9" />
          </Link>
        </div>
      )}

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item: any) => {
          const isActive = pathname.startsWith(item.href);
          
          if (item.isComingSoon) {
            return (
              <div
                key={item.href}
                className="flex items-center justify-between px-3 py-2 rounded text-slate-400 cursor-not-allowed group relative"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined opacity-50">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="text-[8px] font-black bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-tighter">Soon</span>
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <WhatsAppLinkStatus 
        isLinked={!!user?.isWhatsAppLinked} 
        variant="sidebar" 
      />

      <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2">
            <div className="size-11 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
              <span className="material-symbols-outlined text-slate-400 text-2xl">
                person
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black truncate text-[#0F2B4C] dark:text-white leading-tight">
                {getDisplayName(user) ||
                  user?.email?.split("@")[0] ||
                  "Merchant User"}
              </p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {user?.role === "MERCHANT"
                  ? "Merchant"
                  : user?.role === "BUYER"
                    ? "Buyer"
                    : user?.role === "SUPER_ADMIN"
                      ? "Admin"
                      : user?.role || "User"}
              </p>
            </div>
            <Link href="/merchant/settings" className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group">
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-xl">
                settings
              </span>
            </Link>
          </div>
          
          <button
            onClick={() => logout()}
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group w-full"
          >
            <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">logout</span>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">
              Logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
