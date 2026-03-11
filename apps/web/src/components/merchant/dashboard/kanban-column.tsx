import React from "react";

interface Props {
  title: string;
  count: number;
  colorClass: string;
  children: React.ReactNode;
}

export function KanbanColumn({ title, count, colorClass, children }: Props) {
  return (
    <div className="flex flex-col h-full min-w-[300px] sm:min-w-[340px] w-full max-w-[340px] bg-slate-50/50 dark:bg-slate-900/50 rounded-[2rem] p-4 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors group">
      <div className="flex items-center justify-between mb-5 px-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`size-2.5 rounded-full shadow-lg shadow-${colorClass.replace('bg-', '')}/30 ${colorClass}`} />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {title}
          </h3>
          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-[9px] font-black">
            {count}
          </span>
        </div>
        <button className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[20px] hover:text-primary transition-colors">
          more_horiz
        </button>
      </div>
      
      <div className="space-y-4 overflow-y-auto pr-1 pb-10 no-scrollbar flex-1">
        {children}
      </div>
    </div>
  );
}
