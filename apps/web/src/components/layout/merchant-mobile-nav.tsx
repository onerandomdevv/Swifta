"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MerchantMobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", icon: "grid_view", href: "/merchant/dashboard" },
    { label: "Orders", icon: "format_list_bulleted", href: "/merchant/orders" },
    { label: "New", icon: "add", href: "/merchant/products?action=list", isCenter: true },
    { label: "Wallet", icon: "account_balance_wallet", href: "/merchant/wallet" },
    { label: "Settings", icon: "settings", href: "/merchant/settings" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href.split("?")[0] + "/");

        if (item.isCenter) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 -mt-4"
            >
              <div className="size-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-2xl">add</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tight text-primary">
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1",
              isActive ? "text-primary" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <span className={cn("material-symbols-outlined", isActive && "font-variation-fill")}>
              {item.icon}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-tight">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
