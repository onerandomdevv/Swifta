"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../providers/auth-provider";
import { Logo } from "@/components/ui/logo";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const { user } = useAuth();

  const { data: stats } = useQuery<{ pendingMerchants: number }>({
    queryKey: ["admin", "stats"],
    queryFn: () => apiClient.get("/admin/stats"),
    refetchInterval: 30000, // Refresh every 30s
  });

  const navLinks = [
    { name: "Overview", href: "/admin", icon: "dashboard" },
    { name: "Analytics", href: "/admin/analytics", icon: "monitoring" },
    {
      name: "Merchants",
      href: "/admin/merchants",
      icon: "storefront",
      badge:
        (stats?.pendingMerchants ?? 0) > 0 ? stats?.pendingMerchants : null,
    },
    { name: "Users", href: "/admin/users", icon: "group" },
    { name: "Orders", href: "/admin/orders", icon: "local_shipping" },
    { name: "Payouts", href: "/admin/payouts", icon: "payments" },
    { name: "Catalogue", href: "/admin/inventory", icon: "inventory_2" },
    { name: "Access Tokens", href: "/admin/access-tokens", icon: "key" },
    { name: "Settings", href: "/admin/settings", icon: "settings" },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 text-white bg-navy-dark rounded-md"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-navy-dark text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 h-full overflow-y-auto shrink-0 shadow-xl`}
      >
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <Logo variant="dark" size="md" />
          </div>
          <span className="mt-2 block text-xs font-black uppercase text-primary tracking-widest">
            {user?.role?.replace("_", " ") || "ADMIN"}
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-deep-blue shadow-lg shadow-primary/20 scale-[1.02]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="material-symbols-outlined">{link.icon}</span>
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className="bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-lg shadow-orange-500/20">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
