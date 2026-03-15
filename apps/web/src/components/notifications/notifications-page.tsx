"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications, NotificationUI } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationCategory = "All" | "Orders" | "Payments" | "Account Security" | "Marketing";

interface NotificationsSharedPageProps {
  role: "merchant" | "buyer";
}

export function NotificationsSharedPage({ role }: NotificationsSharedPageProps) {
  const router = useRouter();
  const { 
    notifications, 
    loading, 
    markAsRead, 
    markAllAsRead,
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<NotificationCategory>("All");
  const [onlyUnread, setOnlyUnread] = useState(false);

  const categories: NotificationCategory[] = [
    "All",
    "Orders",
    "Payments",
    "Account Security",
    "Marketing",
  ];

  const getUnreadCount = (cat: NotificationCategory) => {
    return notifications.filter((n: NotificationUI) => {
      const matchesTab = cat === ("All" as any) || (n.category as any) === cat || (cat === ("All" as any) && n.category === "All Activity");
      return matchesTab && n.unread;
    }).length;
  };

  const filteredNotifications = notifications.filter((n: NotificationUI) => {
    // Note: use-notifications.ts uses "All Activity" as a value for category
    const matchesTab = activeTab === ("All" as any) || (n.category as any) === activeTab || (activeTab === ("All" as any) && n.category === "All Activity");
    const matchesUnread = !onlyUnread || n.unread;
    return matchesTab && matchesUnread;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 px-2">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Notifications</h2>
          <p className="text-sm font-semibold text-slate-500 mt-2 uppercase tracking-widest">Global Activity Stream</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 h-11 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 md:flex-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Unread</span>
            <button 
              onClick={() => setOnlyUnread(!onlyUnread)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                onlyUnread ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
              )}
            >
              <span className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                onlyUnread ? "translate-x-4" : "translate-x-0"
              )} />
            </button>
          </div>
          <Button 
            onClick={() => markAllAsRead()}
            className="bg-slate-900 border border-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 px-6 h-11 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-slate-900/10"
          >
            <span className="material-symbols-outlined text-lg">done_all</span>
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Categories / Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8 mb-10 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2">
        {categories.map((cat) => {
          const unreadCountForCat = getUnreadCount(cat);
          const isActive = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={cn(
                "flex items-center gap-2 px-1 py-5 border-b-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                isActive 
                  ? "border-primary text-primary" 
                  : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {cat}
              {unreadCountForCat > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[9px] font-bold",
                  isActive ? "bg-primary/10 text-primary" : "bg-slate-50 dark:bg-slate-800 text-slate-400"
                )}>
                  {unreadCountForCat}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex flex-col gap-5 px-2">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 border-dashed">
            <div className="bg-slate-50 dark:bg-slate-800 size-24 rounded-full flex items-center justify-center mb-8 border border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-slate-200 dark:text-slate-700 text-6xl">notifications_off</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Terminal Clear</h3>
            <p className="text-sm font-medium text-slate-400 mt-2 max-w-xs mx-auto">
              {onlyUnread 
                ? "You have no unverified alerts in this sector." 
                : "No incoming transmissions at this time. We'll alert your terminal when updates occur."}
            </p>
          </div>
        ) : (
          <>
            {filteredNotifications.map((n: NotificationUI) => (
              <div 
                key={n.id}
                className={cn(
                  "group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border transition-all duration-300",
                  n.unread 
                    ? "border-primary/10 shadow-sm" 
                    : "border-slate-100 dark:border-white/5 opacity-80 hover:opacity-100"
                )}
              >
                <div className="flex items-start gap-6">
                  <div className={cn(
                    "size-14 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                    n.unread 
                      ? "bg-primary/[0.03] text-primary border-primary/20" 
                      : "bg-slate-50 dark:bg-slate-800/50 text-slate-300 border-slate-100 dark:border-slate-800"
                  )}>
                    <span className="material-symbols-outlined text-2xl font-variation-light">{n.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-md border",
                          n.unread 
                            ? "bg-primary/5 text-primary border-primary/10" 
                            : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-100 dark:border-slate-800"
                        )}>
                          {n.category}
                        </span>
                        {n.unread && (
                          <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">New</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        {n.time}
                      </p>
                    </div>

                    <h4 className={cn(
                      "text-lg font-bold tracking-tight mb-1.5",
                      n.unread ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                    )}>
                      {n.title}
                    </h4>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 max-w-3xl">
                      {n.desc}
                    </p>

                    <div className="flex items-center gap-3 mt-8">
                      {n.action && (
                        <button
                          onClick={() => {
                            if (n.unread) markAsRead(n.id);
                            if (n.actionUrl) router.push(n.actionUrl);
                          }}
                          className="bg-slate-900 border border-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all active:scale-95"
                        >
                          {n.action}
                        </button>
                      )}
                      {!n.action && n.unread && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all">
                        Details
                      </button>
                      <button className="ml-auto opacity-0 group-hover:opacity-100 transition-all p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Bottom Indicator */}
            <div className="flex flex-col items-center justify-center py-20 mt-12 text-center border-t border-slate-100 dark:border-slate-800 border-dashed">
              <div className="bg-slate-50 dark:bg-slate-800/50 size-24 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl font-variation-light">verified</span>
              </div>
              <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.25em] text-[10px]">End of Transmissions • Terminal Secure</p>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
