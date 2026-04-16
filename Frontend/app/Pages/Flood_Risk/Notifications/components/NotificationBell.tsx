"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearFloodReturnPath,
  FLOOD_NOTIFICATIONS_FALLBACK,
  FLOOD_NOTIFICATIONS_PATH,
  getFloodReturnPath,
  setFloodReturnPathFromNavigation,
} from "../floodNotificationsNavigation";

interface NotificationBellProps {
  unreadCount: number;
  href?: string;
}

function isNotificationsPath(pathname: string, notificationsHref: string): boolean {
  return pathname === notificationsHref || pathname.startsWith(`${notificationsHref}/`);
}

export default function NotificationBell({
  unreadCount,
  href = FLOOD_NOTIFICATIONS_PATH,
}: NotificationBellProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    router.prefetch(href);
    router.prefetch(FLOOD_NOTIFICATIONS_FALLBACK);
  }, [router, href]);

  const onBellClick = () => {
    // On notifications page: back to saved path or Alert
    if (isNotificationsPath(pathname, href)) {
      const stored = getFloodReturnPath();
      clearFloodReturnPath();
      if (stored) {
        router.back();
      } else {
        router.push(FLOOD_NOTIFICATIONS_FALLBACK);
      }
      return;
    }
    // Else: save current path, go to notifications
    setFloodReturnPathFromNavigation(pathname);
    router.push(href);
  };

  const onNotifications = isNotificationsPath(pathname, href);
  const badgeIsCompact = unreadCount > 99;

  return (
    <button
      type="button"
      onClick={onBellClick}
      className="group relative z-30 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-600 text-white shadow-sm transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label={onNotifications ? "Return to previous page" : "Open notifications"}
      title={onNotifications ? "Return to previous page" : "Open notifications"}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-5 w-5 translate-x-0.5 transition group-hover:scale-105"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
        <path d="M9 17a3 3 0 0 0 6 0" />
      </svg>
      {unreadCount > 0 ? (
        <span
          className={`absolute -right-1 -top-1 flex h-6 min-h-6 items-center justify-center rounded-full border-2 border-white bg-red-600 font-bold leading-none text-white shadow-md tabular-nums ring-1 ring-red-900/25 ${
            badgeIsCompact
              ? "min-w-[2rem] px-1 text-xs"
              : "min-w-6 px-1 text-sm"
          }`}
        >
          {badgeIsCompact ? "99+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}
