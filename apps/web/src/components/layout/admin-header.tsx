"use client";

import React, { useState } from "react";
import { NotificationCenter } from "./notification-center";
import { useNotifications } from "@/hooks/use-notifications";

export function AdminHeader() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { unreadCount } = useNotifications(true, true);

  return (
    <header className="bg-white dark:bg-slate-950 border-b-2 border-slate-50 dark:border-slate-800 p-4 sticky top-0 z-30 flex items-center justify-end md:justify-between h-16 shadow-sm">
      <div className="hidden md:flex flex-col">
        <h2 className="text-xl font-black uppercase text-navy-dark dark:text-white tracking-widest break-all line-clamp-1">
          PLATFORM ADMINISTRATION
        </h2>
      </div>

      <div className="flex items-center space-x-6">
        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="relative p-2 text-slate-400 hover:text-navy-dark dark:hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">
            notifications
          </span>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
        </button>

        <NotificationCenter
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full pr-4 border border-slate-200 dark:border-slate-700">
          <div className="h-8 w-8 rounded-full bg-brand text-navy-dark flex items-center justify-center font-bold text-xs">
            OP
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Operator
          </span>
        </div>
      </div>
    </header>
  );
}
