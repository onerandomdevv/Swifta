"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Logo } from "@/components/ui/logo";

export function BuyerSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { label: "Dashboard", icon: "dashboard", href: "/buyer/dashboard" },
    { label: "Catalogue", icon: "inventory_2", href: "/buyer/catalogue" },
    { label: "My RFQs", icon: "request_quote", href: "/buyer/rfqs" },
    { label: "Active Orders", icon: "local_shipping", href: "/buyer/orders" },
  ];

  return (
    <aside className="hidden lg:flex w-[240px] flex-col border-r border-slate-200 bg-white h-screen sticky top-0">
      <div className="p-6">
        <Logo variant="light" size="md" />
      </div>
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
