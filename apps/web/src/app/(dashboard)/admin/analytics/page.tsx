"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/providers/toast-provider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface AnalyticsPayload {
  funnel: {
    totalRfqs: number;
    totalQuotes: number;
    totalOrders: number;
  };
  financials: {
    gmvKobo: number;
    escrowLiabilityKobo: number;
  };
  market: {
    topCategories: Array<{ name: string; value: number }>;
  };
}

const PIE_COLORS = ["#00F0FF", "#0047FF", "#FFB800", "#FF3D00", "#00C853"];

export default function AdminAnalyticsPage() {
  const toast = useToast();

  const { data: analytics, isLoading } = useQuery<AnalyticsPayload>({
    queryKey: ["admin", "analytics"],
    queryFn: () => apiClient.get("/admin/analytics"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-neon-cyan">
          progress_activity
        </span>
      </div>
    );
  }

  // Formatting Data for Recharts
  const funnelData = analytics
    ? [
        { name: "Requests (RFQs)", count: analytics.funnel.totalRfqs },
        { name: "Quotes Issued", count: analytics.funnel.totalQuotes },
        { name: "Orders Placed", count: analytics.funnel.totalOrders },
      ]
    : [];

  const marketData = analytics?.market.topCategories || [];

  return (
    <div className="space-y-8 animate-in mt-4 fade-in slide-in-from-bottom-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-navy-dark dark:text-white uppercase tracking-widest">
            Market Intelligence
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">
            Global Analytics & Trade Velocity
          </p>
        </div>

        <button
          onClick={async () => {
            toast.info("Generating CSV Export...");
            try {
              const response = await apiClient.get("/admin/orders/export");
              const blob = new Blob([response as string], {
                type: "text/csv;charset=utf-8;",
              });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute(
                "download",
                `swifta_financials_${new Date().toISOString().split("T")[0]}.csv`,
              );
              document.body.appendChild(link);
              link.click();
              link.remove();
              toast.success("Financial data exported successfully.");
            } catch (error) {
              toast.error("Failed to export financial data.");
            }
          }}
          className="bg-brand text-navy-dark hover:bg-neon-cyan px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">
            download
          </span>
          Export Data (CSV)
        </button>
      </header>

      {/* High-Level Financial Macros */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-brand to-navy-dark p-6 rounded-[2rem] shadow-xl relative overflow-hidden group hover:shadow-brand/20 transition-all">
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase text-neon-cyan/80 tracking-widest mb-2">
              Total Gross Volume (GMV)
            </h3>
            <p className="text-4xl lg:text-5xl font-black text-white">
              ₦{((analytics?.financials.gmvKobo || 0) / 100).toLocaleString()}
            </p>
            <p className="text-xs font-bold text-white/60 mt-2">
              All completed and transit orders
            </p>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-white/5 rotate-[-15deg] group-hover:rotate-0 transition-transform duration-500">
            account_balance
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-orange-100 dark:border-orange-900/30 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase text-orange-400 tracking-widest mb-2">
              Total Escrow Liability
            </h3>
            <p className="text-4xl lg:text-5xl font-black text-navy-dark dark:text-white">
              ₦
              {(
                (analytics?.financials.escrowLiabilityKobo || 0) / 100
              ).toLocaleString()}
            </p>
            <p className="text-xs font-bold text-slate-500 mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">
                lock
              </span>{" "}
              Funds held pending OTP
            </p>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-orange-500/5 rotate-[-15deg] group-hover:rotate-0 transition-transform duration-500">
            security
          </span>
        </div>
      </section>

      {/* Chart Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trade Funnel Dropoff */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 md:p-8 rounded-[2rem] shadow-sm">
          <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4 flex justify-between">
            <span>Platform Funnel Dropoff</span>
            <span className="material-symbols-outlined text-slate-400">
              filter_alt
            </span>
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.02)" }}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#00F0FF"
                  radius={[8, 8, 8, 8]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Demand Pie */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 md:p-8 rounded-[2rem] shadow-sm">
          <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest border-b-2 border-slate-100 dark:border-slate-800 pb-4 mb-2 flex justify-between">
            <span>Top Requested Categories</span>
            <span className="material-symbols-outlined text-slate-400">
              pie_chart
            </span>
          </h3>
          <div className="h-[300px] w-full">
            {marketData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marketData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {marketData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
                  data_alert
                </span>
                <p className="text-xs font-bold uppercase">
                  Not Enough Market Data
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
