"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export function MerchantSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { label: "Dashboard", icon: "dashboard", href: "/merchant/dashboard" },
    { label: "Products", icon: "category", href: "/merchant/products" },
    { label: "RFQs", icon: "description", href: "/merchant/rfqs" },
    { label: "Quotes", icon: "request_quote", href: "/merchant/quotes" },
    { label: "Orders", icon: "local_shipping", href: "/merchant/orders" },
    { label: "Inventory", icon: "warehouse", href: "/merchant/inventory" },
    { label: "Analytics", icon: "analytics", href: "/merchant/analytics" },
    {
      label: "Verification",
      icon: "verified_user",
      href: "/merchant/verification",
    },
  ];

  return (
    <aside className="w-64 bg-primary-navy flex-shrink-0 flex flex-col text-white z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-white">
            construction
          </span>
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">Hardware OS</h1>
          <p className="text-xs text-white/60">Lagos Trading Hub</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <button
          onClick={() => logout()}
          className="flex w-full items-center justify-start gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
