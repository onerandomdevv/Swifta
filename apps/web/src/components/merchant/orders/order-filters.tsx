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
    <div className="flex items-center gap-2 border-b-2 border-slate-900 dark:border-slate-100 pb-0 overflow-x-auto no-scrollbar">
      {(["ALL", "PENDING", "DISPATCH_READY", "COMPLETED"] as const).map(
        (tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap -mb-[2px] ${
              activeTab === tab
                ? "border-primary text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ),
      )}
    </div>
  );
}
