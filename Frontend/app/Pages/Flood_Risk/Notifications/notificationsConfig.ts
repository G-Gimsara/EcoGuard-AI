// Shared config for flood notification content + visuals.
import { getAffectedAreaLinesForLevel, type LevelName } from "../Alert/floodLevelConfig";

// Shape stored in localStorage and rendered in notification cards.
export interface FloodNotification {
  id: string;
  level: LevelName;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  riseLevel: number;
  affectedAreas?: string[];
}

export interface NotificationVisual {
  icon: string;
  badgeClass: string;
  cardClass: string;
  dotClass: string;
}

// Storage and retention settings for client-side notification history.
export const FLOOD_NOTIFICATIONS_STORAGE_KEY = "flood_notifications_v1";
export const FLOOD_NOTIFICATIONS_LIMIT = 100;

// User-facing title/body text per flood level.
export const floodNotificationContent: Record<LevelName, { title: string; message: string }> = {
  Normal: {
    title: "Normal Level",
    message: "Water level is normal. No risk detected.",
  },
  Alert: {
    title: "Alert Level Detected",
    message: "Water level is rising. Stay aware and prepare for possible flooding.",
  },
  Minor: {
    title: "Minor Flood Level Detected",
    message: "Minor flooding detected in low-lying areas. Be cautious.",
  },
  Moderate: {
    title: "Moderate Flood Level Detected",
    message: "Moderate flooding detected. Residents should prepare to move to safer areas.",
  },
  Major: {
    title: "Major Flood Level Detected",
    message: "Major flooding detected. Immediate action may be required.",
  },
  Critical: {
    title: "Critical Flood Level Detected",
    message: "Critical flood danger. Evacuation and emergency response required immediately.",
  },
};

// Visual tokens used by notification list items.
export const floodNotificationVisuals: Record<LevelName, NotificationVisual> = {
  Normal: {
    icon: "✅",
    badgeClass: "bg-emerald-100 text-emerald-800",
    cardClass: "border-emerald-200 bg-emerald-50",
    dotClass: "bg-emerald-500",
  },
  Alert: {
    icon: "⚠️",
    badgeClass: "bg-yellow-100 text-yellow-900",
    cardClass: "border-yellow-200 bg-yellow-50",
    dotClass: "bg-yellow-500",
  },
  Minor: {
    icon: "💧",
    badgeClass: "bg-orange-100 text-orange-900",
    cardClass: "border-orange-200 bg-orange-50",
    dotClass: "bg-orange-500",
  },
  Moderate: {
    icon: "🌊",
    badgeClass: "bg-amber-100 text-amber-900",
    cardClass: "border-amber-300 bg-amber-50",
    dotClass: "bg-amber-600",
  },
  Major: {
    icon: "🚨",
    badgeClass: "bg-rose-100 text-rose-900",
    cardClass: "border-rose-300 bg-rose-50",
    dotClass: "bg-rose-600",
  },
  Critical: {
    icon: "🔥",
    badgeClass: "bg-red-700 text-white",
    cardClass: "border-red-400 bg-red-50",
    dotClass: "bg-red-700",
  },
};

// Create one notification row from the latest detected level.
export function createNotificationFromLevel(level: LevelName, riseLevel: number): FloodNotification {
  const content = floodNotificationContent[level];
  return {
    // Timestamp + random suffix is enough uniqueness for client-side history.
    id: `${Date.now()}-${level}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    title: content.title,
    message: content.message,
    timestamp: new Date().toISOString(),
    isRead: false,
    riseLevel,
    affectedAreas: getAffectedAreaLinesForLevel(level),
  };
}
