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
import { levels, type LevelName } from "../../Alert/floodLevelConfig";
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
  /** Latest flood severity from shared REST + WebSocket (for UI badges). */
  liveLevel: LevelName | undefined;
  liveRiseLevel: number;
}

const FloodNotificationsContext = createContext<FloodNotificationsContextValue | null>(null);

const FLOOD_API = "http://localhost:5000/api/flood";
const FLOOD_WS = "ws://localhost:5000";

// Holds notification list, live flood stream, and syncs list to localStorage
export function FloodNotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<FloodNotification[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentSeverity, setCurrentSeverity] = useState("");
  const [liveRiseLevel, setLiveRiseLevel] = useState(0);

  const liveLevel = useMemo(
    () => levels.find((l) => l.name === currentSeverity)?.name as LevelName | undefined,
    [currentSeverity]
  );

  const lastDispatchedLevelRef = useRef<LevelName | null>(null);

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

  // One REST snapshot + one WebSocket for all Flood_Risk routes (bell + list stay in sync).
  useEffect(() => {
    if (!isHydrated) return;
    let cancelled = false;
    fetch(FLOOD_API)
      .then((res) => res.json())
      .then((data: { severity: string; riseLevel: number }[]) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setCurrentSeverity(data[0].severity);
        setLiveRiseLevel(data[0].riseLevel);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const ws = new WebSocket(FLOOD_WS);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "FLOOD_UPDATE" && msg.data) {
          setCurrentSeverity(msg.data.severity);
          setLiveRiseLevel(msg.data.riseLevel);
        }
      } catch {
        /* ignore malformed payloads */
      }
    };
    return () => ws.close();
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated || !liveLevel) return;
    if (lastDispatchedLevelRef.current === liveLevel) return;
    addNotificationForLevel(liveLevel, liveRiseLevel);
    lastDispatchedLevelRef.current = liveLevel;
  }, [isHydrated, liveLevel, liveRiseLevel, addNotificationForLevel]);

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
      liveLevel,
      liveRiseLevel,
    }),
    [
      notifications,
      unreadCount,
      addNotificationForLevel,
      markAllAsRead,
      markAsRead,
      clearAll,
      isHydrated,
      liveLevel,
      liveRiseLevel,
    ]
  );

  return (
    <FloodNotificationsContext.Provider value={value}>{children}</FloodNotificationsContext.Provider>
  );
}

export function useFloodNotifications() {
  const context = useContext(FloodNotificationsContext);
  if (!context) {
    throw new Error("useFloodNotifications must be used inside FloodNotificationsProvider");
  }
  return context;
}
