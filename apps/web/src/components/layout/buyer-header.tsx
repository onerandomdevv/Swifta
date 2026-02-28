"use client";

export function BuyerHeader() {
  return (
    <header className="lg:hidden flex flex-shrink-0 items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-40">
      <span className="text-lg font-bold text-primary">Lagos Wholesale Hub</span>
      <button className="material-symbols-outlined text-slate-900 hover:text-primary transition-colors">
        menu
      </button>
    </header>
  );
}

