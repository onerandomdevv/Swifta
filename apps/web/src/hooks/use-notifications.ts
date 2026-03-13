"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/providers/toast-provider";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/lib/api/notification.api";
import {
  Notification as BackendNotification,
  NotificationType,
} from "@hardware-os/shared";

export interface NotificationUI {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: string;
  icon: string;
  iconColor: string;
  bg: string;
  unread: boolean;
  action?: string;
  actionUrl?: string;
  category: "All Activity" | "Orders" | "Payments" | "Account Security" | "Marketing";
}

export function useNotifications(
  isOpen: boolean = true,
  enableToasts: boolean = false,
) {
  const queryClient = useQueryClient();
  const { info } = useToast();
  const [prevUnreadCount, setPrevUnreadCount] = useState<number | null>(null);

  const mapNotification = useCallback(
    (n: BackendNotification): NotificationUI => {
      let icon = "info";
      let iconColor = "text-slate-500";
      let bg = "bg-slate-50/50";
      let category: NotificationUI["category"] = "All Activity";
      let action: string | undefined = undefined;

      switch (n.type) {
        case NotificationType.PAYMENT_CONFIRMED:
          icon = "account_balance_wallet";
          iconColor = "text-indigo-600 dark:text-indigo-400";
          bg = "bg-indigo-100 dark:bg-indigo-900/30";
          category = "Payments";
          break;
        case NotificationType.ORDER_DISPATCHED:
          icon = "local_shipping";
          iconColor = "text-emerald-600 dark:text-emerald-400";
          bg = "bg-emerald-100 dark:bg-emerald-900/30";
          category = "Orders";
          action = "Process Order";
          break;
        case NotificationType.MERCHANT_VERIFIED:
          icon = "verified";
          iconColor = "text-emerald-600 dark:text-emerald-400";
          bg = "bg-emerald-100 dark:bg-emerald-900/30";
          category = "Account Security";
          break;
        case NotificationType.MERCHANT_REJECTED:
          icon = "error";
          iconColor = "text-rose-500";
          bg = "bg-rose-50/50";
          category = "Account Security";
          break;
        case NotificationType.NEW_MERCHANT_SUBMISSION:
          icon = "person_add";
          iconColor = "text-amber-500";
          bg = "bg-amber-50/50";
          category = "All Activity";
          action = "Review";
          break;
        case NotificationType.PAYOUT_REQUESTED:
          icon = "account_balance_wallet";
          iconColor = "text-indigo-600 dark:text-indigo-400";
          bg = "bg-indigo-100 dark:bg-indigo-900/30";
          category = "Payments";
          action = "Process";
          break;
        case NotificationType.PAYOUT_REQUEST_RECEIVED:
          icon = "sync";
          iconColor = "text-blue-500";
          bg = "bg-blue-100 dark:bg-blue-900/30";
          category = "Payments";
          break;
        default:
          // Fallback for new types
          if (n.title.toLowerCase().includes("stock")) {
            icon = "warning";
            iconColor = "text-amber-600 dark:text-amber-400";
            bg = "bg-amber-100 dark:bg-amber-900/30";
            category = "Orders";
            action = "Restock Now";
          } else if (n.title.toLowerCase().includes("campaign") || n.title.toLowerCase().includes("sale")) {
            icon = "campaign";
            iconColor = "text-primary";
            bg = "bg-primary/10";
            category = "Marketing";
          }
      }

      return {
        id: n.id,
        title: n.title,
        desc: n.body,
        time: formatRelativeTime(n.createdAt),
        type: n.type.toLowerCase(),
        icon,
        iconColor,
        bg,
        unread: !n.isRead,
        action,
        category,
      };
    },
    [],
  );

// Helper for relative time like the mockup
function formatRelativeTime(dateInput: string | Date) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
}

  const {
    data: notifications = [],
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async () => {
      const result = await getNotifications(1, 20);
      const list = Array.isArray(result) ? result : (result as any)?.data || [];
      return list.map(mapNotification);
    },
    enabled: isOpen,
    refetchInterval: isOpen ? 60000 : false,
  });

  const { data: unreadData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const result = await getUnreadCount();
      return (result as any)?.count ?? (result as any)?.data?.count ?? 0;
    },
    enabled: isOpen,
    refetchInterval: isOpen ? 60000 : false,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = unreadData || 0;

  useEffect(() => {
    if (
      enableToasts &&
      prevUnreadCount !== null &&
      unreadCount > prevUnreadCount
    ) {
      info("You have new notifications.");
    }
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount, enableToasts, info]);

  return {
    notifications,
    unreadCount,
    loading,
    isError,
    error,
    refresh: refetch,
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
  };
}
