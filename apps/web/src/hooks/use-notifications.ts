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
  category: "Orders" | "Financials" | "System";
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
      let category: "Orders" | "Financials" | "System" = "System";
      let action: string | undefined = undefined;

      switch (n.type) {
        case NotificationType.QUOTE_RECEIVED:
          icon = "payments";
          iconColor = "text-blue-500";
          bg = "bg-blue-50/50";
          category = "Orders";
          action = "Review Quote";
          break;
        case NotificationType.PAYMENT_CONFIRMED:
          icon = "check_circle";
          iconColor = "text-emerald-500";
          bg = "bg-emerald-50/50";
          category = "Financials";
          break;
        case NotificationType.ORDER_DISPATCHED:
          icon = "local_shipping";
          iconColor = "text-orange-500";
          bg = "bg-orange-50/50";
          category = "Orders";
          action = "Tracking Active";
          break;
        case NotificationType.MERCHANT_VERIFIED:
          icon = "verified";
          iconColor = "text-emerald-500";
          bg = "bg-emerald-50/50";
          category = "System";
          break;
        case NotificationType.MERCHANT_REJECTED:
          icon = "error";
          iconColor = "text-rose-500";
          bg = "bg-rose-50/50";
          category = "System";
          break;
        case NotificationType.NEW_MERCHANT_SUBMISSION:
          icon = "person_add";
          iconColor = "text-amber-500";
          bg = "bg-amber-50/50";
          category = "System";
          action = "Review";
          break;
        case NotificationType.PAYOUT_REQUESTED:
          icon = "account_balance_wallet";
          iconColor = "text-amber-600";
          bg = "bg-amber-50/50";
          category = "Financials";
          action = "Process";
          break;
        case NotificationType.PAYOUT_REQUEST_RECEIVED:
          icon = "sync";
          iconColor = "text-blue-500";
          bg = "bg-blue-50/50";
          category = "Financials";
          break;
        case NotificationType.QUOTE_ACCEPTED:
          icon = "verified";
          iconColor = "text-blue-400";
          bg = "bg-blue-50/20";
          category = "Orders";
          break;
      }

      return {
        id: n.id,
        title: n.title,
        desc: n.body,
        time: new Date(n.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
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
