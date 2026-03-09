import React from "react";

interface Props {
  title: string;
  count: number;
  colorClass: string;
  children: React.ReactNode;
}

export function KanbanColumn({ title, count, colorClass, children }: Props) {
  return (
    <div className="kanban-column flex flex-col h-full min-w-[280px] sm:min-w-[320px] w-full max-w-[320px]">
      <div className="flex items-center justify-between mb-3 px-1 shrink-0">
        <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
          <span
            className={`size-2 rounded-full shadow-sm ${colorClass}`}
          ></span>
          {title}{" "}
          <span className="text-slate-400 font-bold ml-1">({count})</span>
        </h3>
        {/* Decorative icon — no action wired up */}
        <span className="material-symbols-outlined text-slate-400 text-[18px] p-1">
          more_horiz
        </span>
      </div>
      <div className="space-y-3 overflow-y-auto pr-2 pb-8 no-scrollbar flex-1">
        {children}
      </div>
    </div>
  );
}
