'use client';

import { useState, useEffect, useCallback } from 'react';
import * as notificationApi from '@/lib/api/notification.api';

export function useNotifications() {
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await notificationApi.getUnreadCount();
            if (response.success && response.data) {
                setUnreadCount(response.data.count);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUnreadCount();

        // Polling every 60 seconds as per CLAUDE.md
        const interval = setInterval(fetchUnreadCount, 60000);

        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    return {
        unreadCount,
        loading,
        refresh: fetchUnreadCount
    };
}
