"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotificationCenter from "@/components/NotificationCenter";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/providers/auth-provider";

export default function MerchantLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== "MERCHANT") {
      router.push("/buyer/dashboard");
    }
  }, [user, router]);

  const navItems = [
    { label: "Dashboard", icon: "dashboard", href: "/merchant/dashboard" },
    { label: "RFQs", icon: "description", href: "/merchant/rfqs" },
    { label: "Quotes", icon: "request_quote", href: "/merchant/quotes" },
    { label: "Orders", icon: "inventory_2", href: "/merchant/orders" },
    { label: "Inventory", icon: "warehouse", href: "/merchant/inventory" },
    { label: "Analytics", icon: "analytics", href: "/merchant/analytics" },
    {
      label: "Verification",
      icon: "verified_user",
      href: "/merchant/verification",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900">
      {/* Sidebar: 256px Dark Navy */}
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
          <Link
            href="/logout"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header: 64px Height */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm transition-all outline-none"
                placeholder="Search RFQs, products, or buyers..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative text-slate-500 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
              )}
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none group-hover:text-primary transition-colors">
                  {user?.fullName || "User"}
                </p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">
                  Lagos Merchant
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-transparent group-hover:ring-primary/20 transition-all border border-slate-300">
                <img
                  alt="User Profile"
                  className="h-full w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHQ78_-YuWy8Xr7XFNITbF4dB3lK83jZx0BlF55yDt2HZlZrK-av9Q6SbRyUKlHH_pydlRnPyhYMireyCzktFvj5I-krxT8OwGb1TR1qRqZZhm3Q-uTlE0aYm1LD2--3TWjybxZJIaFHkCX6l4YYaF3NVDfhXAUKqIRQ3XcwXKhJuhZ9Gy8aH0lSOEyH20j30n9eJPaNcf3AgnJgJqubUSqiGWn7EzV2c0pTmxcFDWoQ3WGgqkcqlhclFnzTxnSiKQ8o7LCruXVQ"
                />
              </div>
            </div>
          </div>
        </header>

        <NotificationCenter
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-[#14171e]">
          {children}
        </main>
      </div>
    </div>
  );
}
