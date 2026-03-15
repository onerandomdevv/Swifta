import Link from "next/link";
import { ReactNode } from "react";
import { Money } from "@/components/ui/money";

export function MerchantKpiGrid({
  stats,
}: {
  stats: {
    label: string;
    value: ReactNode | bigint | number | string;
    isMoney: boolean;
    trend?: string;
    trendType?: "up" | "neutral" | "down";
    badge?: string;
    icon: string;
    sub: string;
    href?: string;
  }[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {stats.map((stat, idx) => {
        const CardWrapper = stat.href ? Link : "div";
        return (
        <CardWrapper
          href={stat.href || "#"}
          key={idx}
          className="block bg-surface rounded-[2.5rem] p-8 border border-border shadow-sm relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer"
        >
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="size-12 rounded-2xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined font-black">
                {stat.icon}
              </span>
            </div>
            {stat.trend && (
              <span
                className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${stat.trendType === "up" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-background-secondary text-foreground-muted border-border"}`}
              >
                {stat.trend}
              </span>
            )}
            {stat.badge && (
              <span className="px-3 py-1 bg-red-500/10 text-red-600 text-[9px] font-black uppercase tracking-widest border border-red-500/20 rounded-full animate-pulse">
                {stat.badge}
              </span>
            )}
          </div>

          <p className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.2em] mb-2 relative z-10">
            {stat.label}
          </p>
          <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none relative z-10">
            {stat.isMoney ? (
              <Money amount={stat.value as bigint} />
            ) : (
              (stat.value as ReactNode)
            )}
          </h3>
          <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest mt-6 relative z-10">
            {stat.sub}
          </p>

          <div className="absolute -right-6 -bottom-6 size-24 bg-background-secondary/50 dark:bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
        </CardWrapper>
      )})}
    </div>
  );
}
