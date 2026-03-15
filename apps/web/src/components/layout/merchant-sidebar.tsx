"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { getDisplayName } from "@swifta/shared";
import { Logo } from "@/components/ui/logo";
import { WhatsAppLinkStatus } from "@/components/dashboard/whatsapp-link-status";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { ModeSwitcher } from "./mode-switcher";


export function MerchantSidebar({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { unreadCount } = useNotifications();
  const [activeMode, setActiveMode] = useState<"MERCHANT" | "BUYER">("MERCHANT");

  const isDesktop = variant === "desktop";

  const merchantNavigation = [
    {
      group: "Overview",
      items: [
        { label: "Dashboard", icon: "grid_view", href: "/merchant/dashboard" },
        { label: "Business Page", icon: "storefront", href: `/buyer/merchants/${user?.merchantId}` },
      ]
    },
    {
      group: "Operations",
      items: [
        { label: "Orders (Sales)", icon: "format_list_bulleted", href: "/merchant/orders" },
        { label: "Products & Stock", icon: "inventory_2", href: "/merchant/products" },
        { label: "Notifications", icon: "notifications", href: "/merchant/notifications", hasBadge: true },
      ]
    },
    {
      group: "Restocking",
      items: [
        { label: "Supplies Cart", icon: "shopping_cart_checkout", href: "/merchant/procurement/cart" },
        { label: "Wholesale Finder", icon: "factory", href: "/merchant/wholesale", isComingSoon: true },
      ]
    },
    {
      group: "Finance",
      items: [
        { label: "Wallet & Payouts", icon: "account_balance_wallet", href: "/merchant/wallet" },
        { label: "Trade Financing", icon: "sell", href: "/merchant/trade-financing", isComingSoon: true },
      ]
    },
    {
      group: "System",
      items: [
        { label: "Business Verification", icon: "verified_user", href: "/merchant/verification" },
        { label: "Settings", icon: "settings", href: "/merchant/settings" },
      ]
    },
  ];

  const buyerNavigation = [
    {
      group: "Buying",
      items: [
        { label: "Catalogue", icon: "explore", href: "/buyer/catalogue" },
        { label: "Saved Items", icon: "bookmark", href: "/buyer/saved" },
      ]
    },
    {
      group: "Orders",
      items: [
        { label: "My Purchases", icon: "shopping_bag", href: "/merchant/procurement/orders" },
        { label: "Shopping Cart", icon: "shopping_cart", href: "/merchant/procurement/cart" },
      ]
    },
    {
      group: "Navigation",
      items: [
        { label: "Find Merchants", icon: "person_search", href: "/buyer/merchants" },
        { label: "Feed", icon: "feed", href: "/buyer/feed" },
      ]
    },
    {
      group: "System",
      items: [
        { label: "Business Verification", icon: "verified_user", href: "/merchant/verification" },
        { label: "Settings", icon: "settings", href: "/merchant/settings" },
      ]
    },
  ];

  const navigation = activeMode === "MERCHANT" ? merchantNavigation : buyerNavigation;

  return (
    <aside
      className={cn(
        "bg-surface flex flex-col h-full border-r border-border transition-all duration-300",
        isDesktop ? "hidden lg:flex w-72 sticky top-0 h-screen" : "flex w-full min-h-screen"
      )}
    >
      {/* Header Area */}
      <div className={cn("space-y-6", isDesktop ? "p-8 pb-4" : "p-6 pb-4")}>
        {isDesktop && (
          <Link href="/merchant/dashboard" className="flex items-center gap-3 group">
            <Logo variant="light" size="sm" className="group-hover:scale-105 transition-transform" />
          </Link>
        )}
        
        <ModeSwitcher onModeChange={setActiveMode} />
      </div>

      {/* Navigation Area */}
      <nav className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-8">
        {navigation.map((section) => (
          <div key={section.group} className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted px-4">
              {section.group}
            </h4>
            <div className="space-y-1">
              {section.items.map((item: any) => {
                const isActive = pathname.startsWith(item.href);
                
                if (item.isComingSoon) {
                  return (
                    <div
                      key={item.href}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-foreground-muted cursor-not-allowed group relative opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      <span className="text-[13px] font-bold">{item.label}</span>
                      <span className="ml-auto text-[8px] font-black uppercase tracking-tighter bg-background-secondary border border-border px-1.5 py-0.5 rounded">Soon</span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 relative group",
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-foreground-secondary hover:text-foreground hover:bg-surface-hover"
                    )}
                  >
                    <span className={cn(
                      "material-symbols-outlined text-[20px]", 
                      isActive ? "font-variation-fill" : "group-hover:scale-110 transition-transform"
                    )}>
                      {item.icon}
                    </span>
                    <span className={cn("text-[13px]", isActive ? "font-bold" : "font-semibold")}>
                      {item.label}
                    </span>
                    {item.hasBadge && unreadCount > 0 && (
                      <span className={cn(
                        "ml-auto size-2 rounded-full",
                        isActive ? "bg-white" : "bg-primary animate-pulse"
                      )}></span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-6 pt-2 space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Theme</span>
          <span className="text-[10px] font-black text-foreground uppercase tracking-widest bg-background-secondary px-2 py-0.5 rounded border border-border">Auto</span>
        </div>

        <WhatsAppLinkStatus 
          isLinked={!!user?.isWhatsAppLinked} 
          variant="sidebar" 
        />

        {/* User Profile Card */}
        <div className="bg-background-secondary rounded-2xl p-3 border border-border group transition-all hover:bg-surface-hover">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-surface overflow-hidden border border-border shadow-sm shrink-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-foreground-muted">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[13px] font-black truncate text-foreground leading-tight">
                  {getDisplayName(user) || "Merchant"}
                </p>
              </div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-tight opacity-70">
                Verified Seller
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50/50 transition-all duration-200 group font-black text-[11px] uppercase tracking-widest border border-transparent hover:border-rose-100"
        >
          <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">logout</span>
          Logout
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </aside>
  );
}
