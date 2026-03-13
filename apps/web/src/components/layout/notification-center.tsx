"use client";

import React, { useState } from "react";
import { useNotifications, NotificationUI } from "@/hooks/use-notifications";

export function NotificationCenter({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"All" | "Orders" | "Financials">(
    "All",
  );

  const {
    notifications,
    unreadCount,
    loading: isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications(isOpen);

  const filtered = notifications.filter((n: NotificationUI) =>
    activeTab === "All" ? true : n.category === activeTab,
  );

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={onClose}
        ></div>
      )}

      {/* Slide-out Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 z-[70] shadow-2xl border-l border-slate-100 dark:border-slate-800 transition-transform duration-500 ease-out transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
              Notification Center
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full animate-pulse">
                {unreadCount} NEW
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="size-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-navy-dark dark:hover:text-white transition-all"
          >
            <span className="material-symbols-outlined font-black">close</span>
          </button>
        </div>

        {/* Content Description */}
        <div className="px-8 pt-6 pb-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Manage your real-time B2B trade alerts and logistics updates.
          </p>
        </div>

        {/* Tabs */}
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              {["All", "Orders", "Financials"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`text-[10px] font-black uppercase tracking-widest relative pb-4 transition-all ${activeTab === tab ? "text-navy-dark dark:text-white" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-navy-dark dark:bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => markAllAsRead()}
              className="text-[9px] font-black text-slate-400 hover:text-navy-dark dark:hover:text-white uppercase tracking-widest flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">
                done_all
              </span>
              Mark all read
            </button>
          </div>
        </div>

        {/* List Section */}
        <div className="flex-1 overflow-y-auto px-8 pb-32 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Loading alerts...
              </p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((n: NotificationUI) => (
              <div
                key={n.id}
                onClick={() => n.unread && markAsRead(n.id)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer relative group ${n.unread ? "bg-white dark:bg-slate-800/20 border-slate-100 dark:border-slate-800 shadow-sm" : "bg-slate-50/50 dark:bg-slate-900/20 border-transparent opacity-80"}`}
              >
                {n.unread && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-navy-dark dark:bg-blue-500 rounded-r-full"></div>
                )}
                <div className="flex gap-4">
                  <div
                    className={`size-12 rounded-2xl ${n.bg} flex items-center justify-center border border-transparent group-hover:scale-110 transition-transform`}
                  >
                    <span
                      className={`material-symbols-outlined font-black ${n.iconColor}`}
                    >
                      {n.icon}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-black text-navy-dark dark:text-white uppercase tracking-tight">
                        {n.title}
                      </h4>
                      <span className="text-[9px] font-black text-slate-400 uppercase">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tight opacity-80">
                      {n.desc}
                    </p>

                    {n.action && (
                      <div className="pt-2 flex items-center gap-3">
                        {n.type === "order_dispatched" && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 text-orange-600 rounded-lg border border-orange-500/20">
                            <span className="material-symbols-outlined text-xs font-black">
                              location_on
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-widest">
                              Tracking Active
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-60">
              <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-slate-300">
                  notifications_off
                </span>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-navy-dark dark:text-white">
                  No notifications yet
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  We&apos;ll alert you when trade activity occurs.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="absolute bottom-0 left-0 w-full p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-50 dark:border-slate-800">
          <button className="w-full py-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-navy-dark dark:text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
            View All Activity History
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
