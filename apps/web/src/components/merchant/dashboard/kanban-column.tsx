import React from "react";

interface Props {
  title: string;
  count: number;
  colorClass: string;
  children: React.ReactNode;
}

export function KanbanColumn({ title, count, colorClass, children }: Props) {
  // Map titles to specific border colors from the reference design
  const borderClass = title.toUpperCase().includes("ORDERS") 
    ? "border-orange-500" 
    : title.toUpperCase().includes("DISPATCH") 
    ? "border-blue-500" 
    : title.toUpperCase().includes("ROAD") 
    ? "border-indigo-500" 
    : title.toUpperCase().includes("PAYOUT") || title.toUpperCase().includes("SETTLED")
    ? "border-emerald-500"
    : "border-border";

  const textColorClass = title.toUpperCase().includes("ORDERS") 
    ? "text-orange-600" 
    : title.toUpperCase().includes("DISPATCH") 
    ? "text-blue-600" 
    : title.toUpperCase().includes("ROAD") 
    ? "text-indigo-600" 
    : title.toUpperCase().includes("PAYOUT") || title.toUpperCase().includes("SETTLED")
    ? "text-emerald-600"
    : "text-foreground-secondary";

  return (
    <div className="flex flex-col h-full min-w-[320px] sm:min-w-[360px] w-full max-w-[400px] bg-transparent rounded-2xl transition-all group">
      <div className={`flex items-center justify-between px-1 py-3 border-t-2 mb-6 shrink-0 ${borderClass}`}>
        <h3 className={`text-[11px] font-black uppercase tracking-[0.15em] ${textColorClass}`}>
          {title} ({count})
        </h3>
        <button className="text-foreground-muted hover:text-foreground transition-colors">
          <span className="material-symbols-outlined text-[18px]">more_horiz</span>
        </button>
      </div>
      
      <div className="space-y-4 overflow-y-auto pr-2 pb-10 no-scrollbar flex-1">
        {children}
      </div>
    </div>
  );
}
