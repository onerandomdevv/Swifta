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
    <div className="max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 px-2">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0f172a] dark:text-white tracking-tight">Notifications</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your {role} alerts and activity updates</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 md:flex-none">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">Only show unread</span>
            <button 
              onClick={() => setOnlyUnread(!onlyUnread)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                onlyUnread ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
              )}
            >
              <span className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                onlyUnread ? "translate-x-5" : "translate-x-0"
              )} />
            </button>
          </div>
          <Button 
            onClick={() => markAllAsRead()}
            className="bg-primary hover:bg-emerald-600 text-white px-6 h-12 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">done_all</span>
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8 mb-8 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2">
        {categories.map((cat) => {
          const unreadCountForCat = getUnreadCount(cat);
          const isActive = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={cn(
                "flex items-center gap-2 px-1 py-4 border-b-2 text-sm font-bold whitespace-nowrap transition-all",
                isActive 
                  ? "border-primary text-primary" 
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white"
              )}
            >
              {cat}
              {unreadCountForCat > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black",
                  isActive ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                  {unreadCountForCat}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex flex-col gap-4 px-2">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 border-dashed">
            <div className="bg-slate-100 dark:bg-slate-800 size-24 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">notifications_off</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">All caught up!</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
              {onlyUnread 
                ? "You have no unread notifications in this category." 
                : "You don't have any notifications yet. We'll alert you here."}
            </p>
          </div>
        ) : (
          <>
            {filteredNotifications.map((n: NotificationUI) => (
              <div 
                key={n.id}
                className={cn(
                  "group relative bg-white dark:bg-slate-900/50 rounded-3xl p-6 border transition-all duration-300",
                  n.unread 
                    ? "border-primary/20 shadow-sm" 
                    : "border-slate-100 dark:border-slate-800 opacity-90 hover:opacity-100"
                )}
              >
                <div className="flex items-start gap-5">
                  <div className={cn(
                    "size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
                    n.unread ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  )}>
                    <span className="material-symbols-outlined text-2xl font-variation-fill">{n.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg",
                          n.unread ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                          {n.category}
                        </span>
                        {n.unread && (
                          <span className="size-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                        {n.time}
                      </p>
                    </div>

                    <h4 className={cn(
                      "text-lg font-extrabold tracking-tight mb-1 truncate",
                      n.unread ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                    )}>
                      {n.title}
                    </h4>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {n.desc}
                    </p>

                    <div className="flex items-center gap-3 mt-5">
                      {n.action && (
                        <button
                          onClick={() => {
                            if (n.unread) markAsRead(n.id);
                            if (n.actionUrl) router.push(n.actionUrl);
                          }}
                          className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all active:scale-95"
                        >
                          {n.action}
                        </button>
                      )}
                      {!n.action && n.unread && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all"
                        >
                          Mark as read
                        </button>
                      )}
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all border border-slate-100 dark:border-slate-800">
                        View Details
                      </button>
                      <button className="ml-auto opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-rose-50 hover:text-rose-500 rounded-lg">
                        <span className="material-symbols-outlined text-xl">close</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Bottom Indicator */}
            <div className="flex flex-col items-center justify-center py-16 mt-8 text-center border-t border-slate-100 dark:border-slate-800 border-dashed">
              <div className="bg-slate-50 dark:bg-slate-800/50 size-20 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800 shadow-inner">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-3xl font-variation-fill">done_all</span>
              </div>
              <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px]">You&apos;re all up to date for now</p>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
