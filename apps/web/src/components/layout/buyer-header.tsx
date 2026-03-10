"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function BuyerHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="lg:hidden flex items-center justify-between px-4 h-16 bg-white border-b border-slate-200 sticky top-0 z-40">
      <Link
        href="/buyer/dashboard"
        className="transition-opacity hover:opacity-80"
      >
        <Logo variant="light" size="sm" />
      </Link>
      <button
        onClick={onMenuClick}
        className="material-symbols-outlined text-slate-900 hover:text-primary transition-colors p-2 -mr-2"
      >
        menu
      </button>
    </header>
  );
}
