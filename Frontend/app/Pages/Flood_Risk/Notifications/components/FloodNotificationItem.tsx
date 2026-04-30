"use client";

// One notification card row in the notifications feed.
import {
  getAffectedAreaLinesForLevel,
  getNormalAffectedAreasLabel,
} from "../../Alert/floodLevelConfig";
import { floodNotificationVisuals, type FloodNotification } from "../notificationsConfig";

interface FloodNotificationItemProps {
  item: FloodNotification;
  formatTimestamp: (timestamp: string) => string;
  onMarkRead: (id: string) => void;
}

export default function FloodNotificationItem({
  item,
  formatTimestamp,
  onMarkRead,
}: FloodNotificationItemProps) {
  // Visual tokens (badge, border, dot, icon) are derived from severity level.
  const style = floodNotificationVisuals[item.level];
  // Prefer backend-provided affected areas; fall back to config defaults.
  const areas = item.affectedAreas ?? getAffectedAreaLinesForLevel(item.level);
  // Build one compact line for the card body.
  const areasInline =
    item.level === "Normal"
      ? getNormalAffectedAreasLabel()
      : areas.length > 0
        ? areas.join(", ")
        : "No areas affected";

  return (
    <article
      className={`rounded-xl border p-5 shadow-sm transition ${style.cardClass} ${
        // Unread cards get a subtle ring so they stand out in the list.
        item.isRead ? "opacity-80" : "ring-1 ring-blue-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-base font-semibold text-slate-700">
            <span aria-hidden>{style.icon}</span>
            <span>{item.level}</span>
            <span className={`rounded-full px-2 py-0.5 text-sm font-bold ${style.badgeClass}`}>
              {item.isRead ? "Read" : "Unread"}
            </span>
          </p>
          <h3 className="mt-1.5 text-xl font-bold text-slate-900">{item.title}</h3>
          <p className="mt-1.5 text-base text-slate-700">{item.message}</p>

          <p className="mt-3 break-words border-t border-slate-200/80 pt-3 text-base leading-snug text-slate-700 line-clamp-2">
            <span className="font-semibold text-slate-800">Affected Areas:</span> {areasInline}
          </p>

          {/* Keep meta info lightweight compared to title/message. */}
          <p className="mt-1.5 text-sm text-slate-600">
            {formatTimestamp(item.timestamp)} | Water rise: {item.riseLevel} mm
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Hide action once the notification is already marked as read. */}
          {!item.isRead ? (
            <button
              type="button"
              onClick={() => onMarkRead(item.id)}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Mark read
            </button>
          ) : null}
          <span className={`h-2.5 w-2.5 rounded-full ${style.dotClass}`} aria-hidden />
        </div>
      </div>
    </article>
  );
}
