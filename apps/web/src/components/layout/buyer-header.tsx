"use client";

import Link from "next/link";
import { useNotifications } from "@/hooks/use-notifications";

export function BuyerHeader({
  onOpenNotifications,
}: {
  onOpenNotifications: () => void;
}) {
  const { unreadCount } = useNotifications();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-navy-dark text-white flex items-center justify-between px-6 z-50 border-b border-white/5 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/buyer/dashboard" className="flex items-center gap-2 group">
          <div className="size-8 bg-white/10 rounded flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <span className="material-symbols-outlined text-white text-xl">
              architecture
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Hardware<span className="text-accent-orange">OS</span>
          </h1>
        </Link>
      </div>

      <div className="flex-1 max-w-2xl px-8 hidden md:block">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-white/50 text-xl group-focus-within:text-white transition-colors">
              search
            </span>
          </div>
          <input
            className="block w-full bg-white/10 border-transparent focus:bg-white focus:text-navy-dark focus:ring-0 rounded-lg py-2 pl-10 pr-3 text-sm placeholder-white/60 transition-all outline-none"
            placeholder="Search for tools, materials, or brands..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={onOpenNotifications}
          className="p-2 hover:bg-white/10 rounded-full relative transition-colors"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 size-2 bg-accent-orange rounded-full border-2 border-navy-dark animate-pulse"></span>
          )}
        </button>
        <div className="h-8 w-[1px] bg-white/20 mx-2 hidden sm:block"></div>
        <div className="flex items-center gap-3 cursor-pointer hover:bg-white/10 p-1 pr-3 rounded-full transition-colors group">
          <div className="size-8 rounded-full bg-accent-orange flex items-center justify-center font-bold text-xs text-white">
            SI
          </div>
          <span className="text-sm font-medium hidden sm:block group-hover:text-white/90">
            Lagos Branch
          </span>
        </div>
      </div>
    </header>
  );
}
