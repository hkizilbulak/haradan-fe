import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useAuthSession } from '@/hooks/useAuthSession';
import { notificationRepository } from '@/services/notifications';
import type { MyNotificationView } from '@/types/notification';

export function useNotifications() {
  const { isLoggedIn, session } = useAuthSession();
  const [items, setItems] = useState<MyNotificationView[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  const syncUnreadCount = (count: number) => {
    setUnreadCount(count);
    DeviceEventEmitter.emit('SYNC_UNREAD_COUNT', count);
  };

  const fetchUnreadCount = useCallback(async () => {
    if (!isLoggedIn || !session?.accessToken || !notificationRepository) return;
    try {
      const res = await notificationRepository.getUnreadCount(session.accessToken);
      syncUnreadCount(res.unreadCount);
    } catch (err) {
      console.warn('Failed to fetch unread count', err);
    }
  }, [isLoggedIn, session?.accessToken]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('SYNC_UNREAD_COUNT', (count: number) => {
      setUnreadCount(count);
    });
    const sub2 = DeviceEventEmitter.addListener('SYNC_MARK_ALL_READ', () => {
      setItems((prev) => prev.map((item) => (!item.readAt ? { ...item, readAt: new Date().toISOString() } : item)));
    });
    const sub3 = DeviceEventEmitter.addListener('SYNC_DELETE_ITEM', (id: string) => {
      setItems((prev) => prev.filter(i => i.id !== id));
    });
    const sub4 = DeviceEventEmitter.addListener('SYNC_DELETE_ALL', () => {
      setItems([]);
    });
    return () => {
      sub.remove();
      sub2.remove();
      sub3.remove();
      sub4.remove();
    };
  }, []);

  const loadMore = useCallback(
    async (reset = false) => {
      if (!isLoggedIn || !session?.accessToken || !notificationRepository) return;
      if (loading) return;
      if (!reset && !hasMore) return;

      setLoading(true);
      try {
        const cursorToUse = reset ? undefined : nextCursor;
        const res = await notificationRepository.list(session.accessToken, cursorToUse, 20);
        setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
        setHasMore(res.hasMore);
        setNextCursor(res.nextCursor);
      } catch (err) {
        console.warn('Failed to fetch notifications', err);
      } finally {
        setLoading(false);
      }
    },
    [isLoggedIn, session?.accessToken, loading, hasMore, nextCursor]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      if (!isLoggedIn || !session?.accessToken || !notificationRepository) return;
      try {
        await notificationRepository.markRead(id, session.accessToken);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item))
        );
        syncUnreadCount(Math.max(0, unreadCount - 1));
      } catch (err) {
        console.warn('Failed to mark notification as read', err);
      }
    },
    [isLoggedIn, session?.accessToken, unreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    if (!isLoggedIn || !session?.accessToken || !notificationRepository) return;
    try {
      await notificationRepository.markAllRead(session.accessToken);
      setItems((prev) =>
        prev.map((item) => (!item.readAt ? { ...item, readAt: new Date().toISOString() } : item))
      );
      DeviceEventEmitter.emit('SYNC_MARK_ALL_READ');
      syncUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all notifications as read', err);
    }
  }, [isLoggedIn, session?.accessToken]);

  const deleteNotification = useCallback(
    async (id: string) => {
      if (!isLoggedIn || !session?.accessToken || !notificationRepository) return;
      try {
        await notificationRepository.delete(id, session.accessToken);
        
        setItems((prev) => {
          const itemToRemove = prev.find(i => i.id === id);
          if (itemToRemove && !itemToRemove.readAt) {
            syncUnreadCount(Math.max(0, unreadCount - 1));
          }
          return prev.filter(i => i.id !== id);
        });
        DeviceEventEmitter.emit('SYNC_DELETE_ITEM', id);
      } catch (err) {
        console.warn('Failed to delete notification', err);
      }
    },
    [isLoggedIn, session?.accessToken, unreadCount]
  );

  const deleteAllNotifications = useCallback(async () => {
    if (!isLoggedIn || !session?.accessToken || !notificationRepository) return;
    try {
      await notificationRepository.deleteAll(session.accessToken);
      setItems([]);
      syncUnreadCount(0);
      DeviceEventEmitter.emit('SYNC_DELETE_ALL');
    } catch (err) {
      console.warn('Failed to delete all notifications', err);
    }
  }, [isLoggedIn, session?.accessToken]);

  // Initial load of unread count when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
      setItems([]);
      setHasMore(false);
      setNextCursor(undefined);
    }
  }, [isLoggedIn, fetchUnreadCount]);

  return {
    items,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refreshUnreadCount: fetchUnreadCount,
  };
}
