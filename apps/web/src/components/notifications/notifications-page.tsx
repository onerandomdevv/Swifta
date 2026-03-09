"use client";

import { useNotifications, NotificationUI } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export function NotificationsSharedPage({
  role,
}: {
  role: "buyer" | "merchant";
}) {
  const { notifications, loading, markAsRead, markAllAsRead, refresh } =
    useNotifications();

  if (loading) {
    return (
      <div className="flex flex-col h-[60vh] justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-slate-500 font-medium">
          Loading notifications...
        </p>
      </div>
    );
  }

  const handleActionClick = (n: NotificationUI) => {
    markAsRead(n.id);
    // Routing could be added based on n.category or n.action, but for now just mark as read
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-dark tracking-tight">
            Notifications
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Stay updated with your latest alerts and activities
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => refresh()}
            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-10 px-4 flex items-center gap-2 font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">
              refresh
            </span>
            Refresh
          </Button>
          <Button
            onClick={() => markAllAsRead()}
            className="rounded-xl bg-navy-dark text-white hover:bg-navy h-10 px-4 flex items-center gap-2 font-black uppercase tracking-wider text-[10px]"
          >
            <span className="material-symbols-outlined text-[18px]">
              done_all
            </span>
            Mark All Read
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="bg-slate-50 size-20 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-300">
                notifications_active
              </span>
            </div>
            <h3 className="text-lg font-black text-navy-dark mb-1">
              You're all caught up!
            </h3>
            <p className="text-slate-500 text-sm font-medium">
              No new notifications right now. Check back later.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 flex flex-col">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-5 sm:p-6 transition-colors flex gap-4 ${n.unread ? "bg-blue-50/30" : "hover:bg-slate-50"}`}
              >
                {/* Icon */}
                <div
                  className={`shrink-0 size-12 rounded-xl flex items-center justify-center ${n.bg}`}
                >
                  <span
                    className={`material-symbols-outlined text-2xl ${n.iconColor}`}
                  >
                    {n.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {n.category}
                      </span>
                      {n.unread && (
                        <span className="size-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
                      )}
                    </div>
                    <h3
                      className={`text-[15px] mb-1 leading-snug ${n.unread ? "font-black text-navy-dark" : "font-bold text-slate-800"}`}
                    >
                      {n.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-2xl">
                      {n.desc}
                    </p>

                    {n.action && n.unread && (
                      <div className="mt-4">
                        <Button
                          onClick={() => handleActionClick(n)}
                          className="bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary-dark font-bold text-xs h-8 px-4 rounded-lg transition-colors border-0"
                        >
                          {n.action}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start shrink-0">
                    <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                      {/* Using the string format `n.time` temporarily, though distanceToNow is better if we have the createdAt date. Hook returns time as "02:30 PM". We'll just display it. */}
                      {n.time}
                    </span>
                    {n.unread && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-[11px] font-bold text-slate-400 hover:text-slate-600 sm:mt-2 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          check
                        </span>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
