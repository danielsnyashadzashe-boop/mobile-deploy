import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3003';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const backfilledRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mobile/me/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success) return;

      const notifs: AppNotification[] = data.data.notifications;

      // Auto-backfill once per session on first load to catch up on missed notifications
      if (!backfilledRef.current) {
        backfilledRef.current = true;
        try {
          await fetch(`${API_URL}/api/mobile/me/notifications/backfill`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          // Re-fetch after backfill to pick up any newly created records
          const res2 = await fetch(`${API_URL}/api/mobile/me/notifications?limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data2 = await res2.json();
          if (data2.success) {
            setNotifications(data2.data.notifications);
            setUnreadCount(data2.data.unreadCount);
          }
        } catch {
          setNotifications(notifs);
          setUnreadCount(data.data.unreadCount);
        }
        return;
      }

      setNotifications(notifs);
      setUnreadCount(data.data.unreadCount);
    } catch {
      // Non-fatal
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const markAllRead = useCallback(async () => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/mobile/me/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Non-fatal
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60_000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      backfilledRef.current = false;
    }
  }, [isAuthenticated, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, isLoading, fetchNotifications, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
