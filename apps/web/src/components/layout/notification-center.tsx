"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications, NotificationUI } from "@/hooks/use-notifications";

export function NotificationCenter({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
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
        role="dialog"
        aria-modal={isOpen}
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-surface z-[70] shadow-2xl border-l border-border transition-transform duration-500 ease-out transform flex flex-col ${isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"}`}
      >
        {/* Header */}
        <div className="p-8 border-b border-border bg-background-secondary flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
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
            className="size-10 rounded-full border border-border flex items-center justify-center text-foreground-muted hover:text-foreground transition-all"
          >
            <span className="material-symbols-outlined font-black">close</span>
          </button>
        </div>

        {/* Content Description */}
        <div className="px-8 pt-6 pb-2">
          <p className="text-[11px] font-bold text-foreground-muted uppercase tracking-widest leading-relaxed">
            Manage your real-time order and activity alerts and logistics updates.
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
                  className={`text-[10px] font-black uppercase tracking-widest relative pb-4 transition-all ${activeTab === tab ? "text-foreground" : "text-foreground-muted hover:text-foreground-secondary"}`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => markAllAsRead()}
              className="text-[9px] font-black text-foreground-muted hover:text-foreground uppercase tracking-widest flex items-center gap-1"
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
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">
                Loading alerts...
              </p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((n: NotificationUI) => (
              <button
                key={n.id}
                type="button"
                aria-pressed={!n.unread}
                aria-label={`${n.unread ? "Unread" : "Read"} notification: ${n.title}. ${n.desc}`}
                onClick={() => n.unread && markAsRead(n.id)}
                className={`w-full text-left p-6 rounded-3xl border transition-all relative group ${n.unread ? "bg-surface border-border shadow-sm" : "bg-background-secondary/50 border-transparent opacity-80"}`}
              >
                {n.unread && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-r-full"></div>
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
                      <h4 className="text-xs font-black text-foreground uppercase tracking-tight">
                        {n.title}
                      </h4>
                      <span className="text-[9px] font-black text-foreground-muted uppercase">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-foreground-secondary leading-relaxed uppercase tracking-tight opacity-80">
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
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-60">
              <div className="size-16 rounded-3xl bg-background-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-foreground-muted">
                  notifications_off
                </span>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
                  No notifications yet
                </h4>
                <p className="text-[9px] font-bold text-foreground-muted uppercase tracking-widest mt-1">
                  We&apos;ll alert you when trade activity occurs.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="absolute bottom-0 left-0 w-full p-8 bg-surface/80 backdrop-blur-md border-t border-border">
          <button 
            onClick={() => router.push('/merchant/activity-history')}
            className="w-full py-4 bg-background-secondary hover:bg-surface-hover text-foreground text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
            aria-label="View all activity history"
          >
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
