import React from "react";

interface Props {
  title: string;
  count: number;
  colorClass: string;
  children: React.ReactNode;
}

export function KanbanColumn({ title, count, colorClass, children }: Props) {
  return (
    <div className="kanban-column flex flex-col h-full min-w-[300px] w-1/4">
      <div className="flex items-center justify-between mb-4 px-1 shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <span className={`size-2 rounded-full ${colorClass}`}></span>
          {title} ({count})
        </h3>
        <span className="material-symbols-outlined text-slate-400 cursor-pointer">
          more_horiz
        </span>
      </div>
      <div className="space-y-3 overflow-y-auto pr-2 pb-8 no-scrollbar flex-1">
        {children}
      </div>
    </div>
  );
}
