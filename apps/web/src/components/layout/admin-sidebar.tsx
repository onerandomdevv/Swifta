"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../providers/auth-provider";

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const { user } = useAuth();

  const navLinks = [
    { name: "Overview", href: "/admin", icon: "dashboard" },
    { name: "Analytics", href: "/admin/analytics", icon: "monitoring" },
    { name: "Merchants", href: "/admin/merchants", icon: "storefront" },
    { name: "Users", href: "/admin/users", icon: "group" },
    { name: "Orders", href: "/admin/orders", icon: "local_shipping" },
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
            <div className="h-8 w-8 rounded-md bg-brand text-navy-dark flex items-center justify-center font-black text-xl">
              H
            </div>
            <span className="text-xl font-black tracking-tighter">
              HARDWARE<span className="text-brand">OS</span>
            </span>
          </div>
          <span className="mt-2 block text-xs font-black uppercase text-neon-cyan tracking-widest">
            SUPER ADMIN
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
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-brand text-navy-dark shadow-lg shadow-brand/20 scale-[1.02]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
