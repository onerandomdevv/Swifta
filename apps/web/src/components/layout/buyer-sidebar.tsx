"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export function BuyerSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto hidden lg:block sticky top-16 h-[calc(100vh-64px)]">
      <div className="p-6">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Navigation
        </h2>
        <nav className="space-y-1 mb-8">
          {[
            {
              label: "Dashboard",
              icon: "dashboard",
              href: "/buyer/dashboard",
            },
            {
              label: "All Products",
              icon: "grid_view",
              href: "/buyer/catalogue",
            },
            { label: "My RFQs", icon: "description", href: "/buyer/rfqs" },
            {
              label: "My Orders",
              icon: "local_shipping",
              href: "/buyer/orders",
            },
          ].map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all group ${
                  isActive
                    ? "bg-navy-dark/5 text-navy-dark dark:bg-white/10 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-xl ${isActive ? "text-navy-dark dark:text-white" : "text-slate-400 group-hover:text-navy-dark dark:group-hover:text-white"}`}
                >
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Categories
        </h2>
        <nav className="space-y-1 mb-8">
          {[
            { label: "Power Tools", icon: "construction" },
            { label: "Building Materials", icon: "format_paint" },
            { label: "Plumbing & Fittings", icon: "plumbing" },
            { label: "Electrical Supplies", icon: "electrical_services" },
            { label: "Safety & PPE", icon: "chef_hat" },
          ].map((cat) => (
            <a
              key={cat.label}
              className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
              href="#"
            >
              <span className="material-symbols-outlined text-slate-400 group-hover:text-navy-dark dark:group-hover:text-white text-xl">
                {cat.icon}
              </span>
              <span className="text-sm">{cat.label}</span>
            </a>
          ))}
        </nav>

        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Filter By
        </h2>
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white mb-3 block">
              Brand
            </span>
            <div className="space-y-2">
              {[
                "Bosch Professional",
                "Makita Industrial",
                "Dangote Cement",
              ].map((brand) => (
                <label
                  key={brand}
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-navy-dark dark:hover:text-white transition-colors"
                >
                  <input
                    className="rounded border-slate-300 dark:border-slate-700 text-accent-orange focus:ring-accent-orange bg-transparent"
                    type="checkbox"
                  />
                  {brand}
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white mb-3 block">
              Stock Status
            </span>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-navy-dark dark:hover:text-white transition-colors">
              <input
                defaultChecked
                className="rounded border-slate-300 dark:border-slate-700 text-accent-orange focus:ring-accent-orange bg-transparent"
                type="checkbox"
              />
              In Stock (Lagos Warehouse)
            </label>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-start gap-3 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors group font-medium"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
