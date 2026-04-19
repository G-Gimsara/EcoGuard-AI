"use client";

import React, { useState } from "react";
import Header from "@/app/Header/page";
import FloodNotificationItem from "./components/FloodNotificationItem";
import NotificationBell from "./components/NotificationBell";
import { useFloodNotifications } from "./hooks/useFloodNotifications";

export default function FloodNotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    clearAll,
    isHydrated,
    liveLevel,
    liveRiseLevel,
  } = useFloodNotifications();

  // UI filter only; does not delete stored items
  const visibleNotifications =
    activeFilter === "all" ? notifications : notifications.filter((item) => !item.isRead);

  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
        <main className="mx-auto max-w-6xl px-6 py-8 text-base">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Flood Alert Notifications</h1>
              <p className="mt-1.5 text-base text-slate-600">
                Live level events are logged automatically when flood severity changes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NotificationBell unreadCount={unreadCount} />
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={notifications.length === 0 || unreadCount === 0}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-base font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mark all as read
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={notifications.length === 0}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-base font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear all
              </button>
            </div>
          </div>

          <section className="mb-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`rounded-full px-4 py-2 text-base font-semibold transition ${
                    activeFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("unread")}
                  className={`rounded-full px-4 py-2 text-base font-semibold transition ${
                    activeFilter === "unread"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>
              {liveLevel ? (
                <p className="text-base font-semibold text-slate-700">
                  Current live level: <span className="text-blue-700">{liveLevel}</span> | {liveRiseLevel} mm
                </p>
              ) : (
                <p className="text-base text-slate-500">Waiting for live flood data...</p>
              )}
            </div>
          </section>

          {!isHydrated ? (
            <div className="rounded-xl bg-white p-6 text-base text-slate-600 shadow-sm ring-1 ring-slate-200">
              Loading notifications...
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-xl font-semibold text-slate-700">No notifications available</p>
              <p className="mt-1.5 text-base text-slate-500">
                New level detections will appear here automatically.
              </p>
            </div>
          ) : (
            <section className="space-y-4">
              {visibleNotifications.map((item) => (
                <FloodNotificationItem
                  key={item.id}
                  item={item}
                  formatTimestamp={formatTimestamp}
                  onMarkRead={markAsRead}
                />
              ))}
            </section>
          )}
        </main>
      </div>
    </>
  );
}
