"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { getDisplayName } from "@hardware-os/shared";
import { Logo } from "@/components/ui/logo";

export function SupplierSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const navItems = [
    { label: "Dashboard", icon: "dashboard", href: "/supplier/dashboard" },
    {
      label: "Wholesale Products",
      icon: "inventory_2",
      href: "/supplier/products",
    },
    { label: "Settings", icon: "settings", href: "/supplier/settings" },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 z-50">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Logo variant="light" size="sm" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
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

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-300 dark:border-slate-600 shrink-0">
              <span className="material-symbols-outlined text-slate-500 text-lg">
                person
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate text-slate-900 dark:text-white">
                {getDisplayName(user) ||
                  user?.email?.split("@")[0] ||
                  "Supplier User"}
              </p>
              <p className="text-[10px] text-slate-500 xl:truncate">
                {user?.role === "SUPPLIER" ? "Supplier" : "User"}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-2 mt-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors w-full"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="text-xs font-bold uppercase tracking-widest">
              Logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
