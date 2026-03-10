"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Logo } from "@/components/ui/logo";

export function BuyerSidebar({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isDesktop = variant === "desktop";

  const navItems = [
    { label: "Dashboard", icon: "dashboard", href: "/buyer/dashboard" },
    { label: "Catalogue", icon: "inventory_2", href: "/buyer/catalogue" },
    { label: "My Cart", icon: "shopping_cart", href: "/buyer/cart" },
    { label: "Active Orders", icon: "local_shipping", href: "/buyer/orders" },
  ];

  return (
    <aside
      className={`${isDesktop ? "hidden lg:flex w-[240px] border-r border-slate-200 sticky top-0 h-screen" : "flex w-full"} flex-col bg-white overflow-y-auto`}
    >
      {isDesktop && (
        <div className="p-6">
          <Link
            href="/buyer/dashboard"
            className="transition-opacity hover:opacity-80"
          >
            <Logo variant="light" size="md" />
          </Link>
        </div>
      )}
      <nav className="flex-1 px-4 space-y-1 flex flex-col">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary border-l-4 border-primary font-semibold"
                  : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="mt-auto pb-6 space-y-1">
          <Link
            href="/buyer/profile"
            className={`flex items-center gap-3 px-4 py-3 rounded font-medium transition-colors ${
              pathname === "/buyer/profile"
                ? "bg-primary/10 text-primary border-l-4 border-primary font-semibold"
                : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
            }`}
          >
            <span className="material-symbols-outlined">account_circle</span>
            <span>Profile</span>
          </Link>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-start gap-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded transition-colors font-medium border-l-4 border-transparent"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
