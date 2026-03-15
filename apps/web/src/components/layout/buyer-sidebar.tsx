"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { getDisplayName } from "@hardware-os/shared";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function BuyerSidebar({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const isDesktop = variant === "desktop";

  const sections = [
    {
      title: "Browse",
      items: [
        { label: "Catalogue", icon: "inventory_2", href: "/buyer/catalogue" },
        { label: "Merchants", icon: "storefront", href: "/buyer/merchants" },
      ]
    },
    {
      title: "Purchasing",
      items: [
        { label: "My Cart", icon: "shopping_cart", href: "/buyer/cart" },
        { label: "Active Orders", icon: "local_shipping", href: "/buyer/orders" },
        { label: "Saved Items", icon: "bookmark", href: "/buyer/saved" },
      ]
    },
    {
      title: "Account",
      items: [
        { label: "Notifications", icon: "notifications", href: "/buyer/notifications" },
        { label: "Profile Settings", icon: "settings", href: "/buyer/profile" },
      ]
    }
  ];

  return (
    <aside
      className={cn(
        "bg-surface flex flex-col h-full border-r border-border-light transition-all duration-300",
        isDesktop ? "hidden lg:flex w-64 sticky top-0 h-screen" : "flex w-full min-h-screen"
      )}
    >
      {isDesktop && (
        <div className="p-6 mb-2">
          <Link href="/buyer/catalogue" className="flex items-center gap-3">
            <Logo variant="light" size="sm" />
          </Link>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h4 className="px-4 text-[10px] font-bold text-foreground-muted uppercase tracking-[0.15em]">
              {section.title}
            </h4>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative",
                      isActive
                        ? "bg-background-secondary text-primary"
                        : "text-foreground-secondary hover:text-foreground hover:bg-surface-hover"
                    )}
                  >
                    <span className={cn(
                      "material-symbols-outlined text-[20px] transition-colors",
                      isActive ? "text-primary font-variation-fill" : "text-foreground-muted group-hover:text-foreground-secondary"
                    )}>
                      {item.icon}
                    </span>
                    <span className={cn(
                      "text-sm transition-colors",
                      isActive ? "font-bold" : "font-semibold"
                    )}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 mt-auto space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Theme</span>
          <ThemeToggle />
        </div>

        {/* Simplified User Card */}
        <div className="bg-background-secondary rounded-xl p-3 border border-border-light group">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-foreground-muted text-lg">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-foreground leading-tight">
                {getDisplayName(user) || "Buyer Account"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold text-foreground-muted uppercase tracking-wider">
                  Verified Buyer
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Logout */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground-muted hover:text-rose-500 hover:bg-rose-50/50 transition-all text-xs font-bold"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Sign Out
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.03); border-radius: 10px; }
      `}</style>
    </aside>
  );
}
