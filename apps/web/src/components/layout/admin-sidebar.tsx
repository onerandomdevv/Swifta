"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../providers/auth-provider";
import { Logo } from "@/components/ui/logo";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function AdminSidebar({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isDesktop = variant === "desktop";

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
    { name: "Staff", href: "/admin/staff", icon: "badge" },
    { name: "Orders", href: "/admin/orders", icon: "local_shipping" },
    { name: "Payouts", href: "/admin/payouts", icon: "payments" },
    { name: "Catalogue", href: "/admin/inventory", icon: "inventory_2" },
    { name: "Access Tokens", href: "/admin/access-tokens", icon: "key" },
    { name: "Settings", href: "/admin/settings", icon: "settings" },
  ];

  return (
    <aside
      className={`${
        isDesktop ? "hidden lg:flex w-64 sticky top-0 h-screen" : "flex w-full"
      } bg-navy-dark text-white flex-col z-40 overflow-y-auto shrink-0 shadow-xl`}
    >
      <div className="p-6">
        <Logo variant="dark" size="md" />
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
  );
}
