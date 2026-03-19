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
    <div className="flex items-center gap-2 border-b-2 border-foreground pb-0 overflow-x-auto no-scrollbar">
      {(["ALL", "PENDING", "DISPATCH_READY", "COMPLETED"] as const).map(
        (tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all whitespace-nowrap -mb-[2px] ${
              activeTab === tab
                ? "border-primary text-foreground bg-background-secondary"
                : "border-transparent text-foreground-muted hover:text-foreground hover:bg-background-secondary/50"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ),
      )}
    </div>
  );
}
