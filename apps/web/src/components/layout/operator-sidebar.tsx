"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";

export function OperatorSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Overview", href: "/operator", icon: "dashboard" },
    { name: "Merchants", href: "/operator/merchants", icon: "storefront" },
    { name: "Orders", href: "/operator/orders", icon: "local_shipping" },
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
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-800 text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 h-full overflow-y-auto shrink-0 shadow-xl`}
      >
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <Logo variant="dark" size="md" />
          </div>
          <span className="mt-2 block text-xs font-black uppercase text-orange-400 tracking-widest">
            OPERATOR PORTAL
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
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-[1.02]"
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
