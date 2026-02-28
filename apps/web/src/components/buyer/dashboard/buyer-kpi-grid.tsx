import Link from "next/link";
import { ReactNode } from "react";

// The source code uses specific components like <Money /> inside the value prop.
// So we use ReactNode to accept anything, or we just pass the raw data and render it.

export function BuyerKpiGrid({
  kpis,
  pendingPaymentCount,
}: {
  kpis: {
    label: string;
    value: ReactNode;
    trend?: string;
    trendType?: "up" | "down";
    badge?: string;
    icon: string;
    subtext: string;
    href?: string;
  }[];
  pendingPaymentCount: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {kpis.map((kpi, idx) => {
        const CardWrapper = kpi.href ? Link : "div";
        return (
        <CardWrapper
          href={kpi.href || "#"}
          key={idx}
          className="block bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer"
        >
          <div className="flex justify-between items-start mb-8">
            <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <span className="material-symbols-outlined font-black">
                {kpi.icon}
              </span>
            </div>
            {kpi.trend && (
              <span
                className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${kpi.trendType === "up" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}
              >
                {kpi.trend}
              </span>
            )}
            {kpi.badge && (
              <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 rounded-full">
                {kpi.badge}
              </span>
            )}
          </div>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            {kpi.label}
          </p>
          <h3 className="text-4xl font-black text-navy-dark dark:text-white tracking-tighter uppercase leading-none">
            {kpi.value}
          </h3>

          <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {kpi.subtext}
            </p>
            {idx === 0 && (
              <Link
                href="/buyer/rfqs"
                className="text-[9px] font-black text-navy-dark dark:text-white uppercase tracking-widest hover:underline"
              >
                View List
              </Link>
            )}
            {idx === 2 && (
              <Link
                href="/buyer/orders"
                className="text-[9px] font-black text-navy-dark dark:text-white uppercase tracking-widest hover:underline"
              >
                Order History
              </Link>
            )}
          </div>

          {idx === 1 && pendingPaymentCount > 0 && (
            <div className="absolute bottom-0 left-0 h-1 bg-amber-500 w-[65%]"></div>
          )}
        </CardWrapper>
      )})}
    </div>
  );
}
