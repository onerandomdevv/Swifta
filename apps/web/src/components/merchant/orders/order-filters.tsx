import React from "react";

export type MerchantOrderFilter =
  | "ALL"
  | "PENDING"
  | "DISPATCH_READY"
  | "COMPLETED";

interface Props {
  activeTab: MerchantOrderFilter;
  setActiveTab: (tab: MerchantOrderFilter) => void;
}

export function OrderFilters({ activeTab, setActiveTab }: Props) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto no-scrollbar">
      {(["ALL", "PENDING", "DISPATCH_READY", "COMPLETED"] as const).map(
        (tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "border-navy-dark text-navy-dark dark:border-white dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ),
      )}
    </div>
  );
}
