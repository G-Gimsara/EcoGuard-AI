"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { LevelName } from "../../Alert/floodLevelConfig";
import {
  createNotificationFromLevel,
  FLOOD_NOTIFICATIONS_LIMIT,
  FLOOD_NOTIFICATIONS_STORAGE_KEY,
  type FloodNotification,
} from "../notificationsConfig";

// Load from localStorage (empty if missing or invalid JSON)
function loadStoredNotifications(): FloodNotification[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(FLOOD_NOTIFICATIONS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as FloodNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Persist full list after hydrate
function saveStoredNotifications(notifications: FloodNotification[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FLOOD_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
}

interface FloodNotificationsContextValue {
  notifications: FloodNotification[];
  unreadCount: number;
  addNotificationForLevel: (level: LevelName, currentRiseLevel: number) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  isHydrated: boolean;
}

const FloodNotificationsContext = createContext<FloodNotificationsContextValue | null>(null);

// Holds notification list and syncs to localStorage
export function FloodNotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<FloodNotification[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const initial = loadStoredNotifications();
    setNotifications(initial);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveStoredNotifications(notifications);
  }, [notifications, isHydrated]);

  // Skip insert if top item already matches this level
  const addNotificationForLevel = useCallback((level: LevelName, currentRiseLevel: number) => {
    setNotifications((prev) => {
      if (prev[0]?.level === level) return prev;
      const next = [createNotificationFromLevel(level, currentRiseLevel), ...prev];
      return next.slice(0, FLOOD_NOTIFICATIONS_LIMIT);
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(
    () => notifications.reduce((count, item) => count + (item.isRead ? 0 : 1), 0),
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotificationForLevel,
      markAllAsRead,
      markAsRead,
      clearAll,
      isHydrated,
    }),
    [notifications, unreadCount, addNotificationForLevel, markAllAsRead, markAsRead, clearAll, isHydrated]
  );

  return (
    <FloodNotificationsContext.Provider value={value}>{children}</FloodNotificationsContext.Provider>
  );
}

export function useFloodNotifications(currentLevel?: LevelName, riseLevel = 0) {
  const context = useContext(FloodNotificationsContext);
  if (!context) {
    throw new Error("useFloodNotifications must be used inside FloodNotificationsProvider");
  }
  // One notification per level change per session (avoids duplicate from re-renders)
  const lastDispatchedLevelRef = useRef<LevelName | null>(null);

  useEffect(() => {
    if (!context.isHydrated || !currentLevel) return;
    if (lastDispatchedLevelRef.current === currentLevel) return;
    context.addNotificationForLevel(currentLevel, riseLevel);
    lastDispatchedLevelRef.current = currentLevel;
  }, [context, currentLevel, riseLevel]);

  return {
    notifications: context.notifications,
    unreadCount: context.unreadCount,
    addNotificationForLevel: context.addNotificationForLevel,
    markAllAsRead: context.markAllAsRead,
    markAsRead: context.markAsRead,
    clearAll: context.clearAll,
    isHydrated: context.isHydrated,
  };
}
