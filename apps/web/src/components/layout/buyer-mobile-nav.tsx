"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BuyerMobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", icon: "home", href: "/" },
    { label: "Discover", icon: "explore", href: "/buyer/feed" },
    { label: "Catalogue", icon: "inventory_2", href: "/buyer/catalogue" },
    { label: "Orders", icon: "local_shipping", href: "/buyer/orders" },
    { label: "Profile", icon: "account_circle", href: "/buyer/profile" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 ${
              isActive ? "text-primary" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-tight">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
