import React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function BuyerHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="lg:hidden flex items-center justify-between px-4 h-16 bg-surface border-b border-border sticky top-0 z-40">
      <Link
        href="/"
        className="transition-opacity hover:opacity-80"
      >
        <Logo variant="light" size="sm" />
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={onMenuClick}
          className="material-symbols-outlined text-foreground hover:text-primary transition-colors p-2 -mr-2"
        >
          menu
        </button>
      </div>
    </header>
  );
}
