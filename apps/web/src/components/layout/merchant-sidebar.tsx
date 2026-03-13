"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { getDisplayName } from "@hardware-os/shared";
import { Logo } from "@/components/ui/logo";
import { WhatsAppLinkStatus } from "@/components/dashboard/whatsapp-link-status";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function MerchantSidebar({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { unreadCount } = useNotifications();

  const isDesktop = variant === "desktop";

  const navItems = [
    { label: "Dashboard", icon: "grid_view", href: "/merchant/dashboard" },
    {
      label: "Business Page",
      icon: "storefront",
      href: `/buyer/merchants/${user?.merchantId}`,
    },
    { label: "Orders", icon: "format_list_bulleted", href: "/merchant/orders" },
    { label: "Notifications", icon: "notifications", href: "/merchant/notifications", hasBadge: true },
    {
      label: "Products & Stock",
      icon: "inventory_2",
      href: "/merchant/products",
    },
    {
      label: "Suppliers",
      icon: "factory",
      href: "/merchant/wholesale",
      isComingSoon: true,
    },
    {
      label: "Financing",
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
      className={cn(
        "bg-white flex flex-col h-full border-r border-slate-200 transition-all duration-300",
        isDesktop ? "hidden lg:flex w-72 sticky top-0 h-screen" : "flex w-full min-h-screen"
      )}
    >
      {/* Header/Logo Area */}
      {isDesktop && (
        <div className="p-6">
          <Link href="/merchant/dashboard" className="flex items-center gap-3 group">
            <Logo variant="light" size="sm" className="group-hover:scale-105 transition-transform" />
          </Link>
        </div>
      )}

      {/* Navigation Area */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar space-y-1">
        {navItems.map((item: any) => {
          const isActive = pathname.startsWith(item.href);
          
          if (item.isComingSoon) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 cursor-not-allowed group relative"
              >
                <span className="material-symbols-outlined opacity-50">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
                <span className="ml-auto text-[9px] font-black uppercase tracking-widest bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-slate-400">Soon</span>
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group",
                isActive
                  ? "bg-primary/5 text-primary border-r-[3px] border-primary rounded-r-none"
                  : "text-slate-500 hover:text-[#0f172a] hover:bg-slate-50"
              )}
            >
              <span className={cn("material-symbols-outlined", isActive && "font-variation-fill")}>{item.icon}</span>
              <span className={cn("text-sm", isActive ? "font-bold" : "font-medium")}>{item.label}</span>
              {item.hasBadge && unreadCount > 0 && (
                <span className="ml-auto size-2 bg-primary rounded-full ring-4 ring-primary/10 animate-pulse"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 space-y-4">
        <WhatsAppLinkStatus 
          isLinked={!!user?.isWhatsAppLinked} 
          variant="sidebar" 
        />

        {/* User Card */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 group transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-sm shrink-0">
              <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                <span className="material-symbols-outlined">person</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-sm font-black truncate text-[#0f172a] dark:text-white leading-tight">
                  {getDisplayName(user) || "Merchant"}
                </p>
                <Link href="/merchant/settings" className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors group/set">
                  <span className="material-symbols-outlined text-slate-400 group-hover/set:text-primary text-lg">settings</span>
                </Link>
              </div>
              <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded leading-none inline-block">
                Merchant
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all duration-200 border border-transparent hover:border-rose-100 group font-bold text-sm"
        >
          <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">logout</span>
          Logout
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
    </aside>
  );
}
