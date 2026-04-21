"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { levelWarnings, webAlertPolicies, type LevelName } from "../Alert/floodLevelConfig";
import { useFloodNotifications } from "../Notifications/hooks/useFloodNotifications";

function isHighRiskLevel(level: LevelName | undefined) {
  return level === "Major" || level === "Critical";
}

export default function FloodGlobalAlarm() {
  const pathname = usePathname();
  const { liveLevel, liveRiseLevel } = useFloodNotifications();
  const [criticalAcknowledged, setCriticalAcknowledged] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousLevelRef = useRef<LevelName | null>(null);

  useEffect(() => {
    if (liveLevel !== "Critical") {
      setCriticalAcknowledged(false);
    }
  }, [liveLevel]);

  useEffect(() => {
    if (isHighRiskLevel(liveLevel) && audioRef.current) {
      audioRef.current.play().catch((err) => console.log("Audio play error:", err));
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [liveLevel]);

  useEffect(() => {
    if (!liveLevel || !isHighRiskLevel(liveLevel)) {
      previousLevelRef.current = liveLevel ?? null;
      return;
    }
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      previousLevelRef.current = liveLevel;
      return;
    }

    const notify = (title: string, body: string) => {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" });
      }
    };

    const levelChanged = previousLevelRef.current !== liveLevel;
    const warningDetail = `${levelWarnings[liveLevel].detail} Rise level: ${liveRiseLevel} mm.`;

    if (levelChanged) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            notify(`${liveLevel} Flood Alert`, warningDetail);
          }
        });
      } else {
        notify(`${liveLevel} Flood Alert`, warningDetail);
      }
    }

    const policy = webAlertPolicies[liveLevel];
    if (policy.repeatMinutes && (liveLevel === "Major" || (liveLevel === "Critical" && !criticalAcknowledged))) {
      const intervalId = window.setInterval(() => {
        notify(`${liveLevel} Flood Reminder`, `Flood level remains ${liveLevel}. Follow safety guidance immediately.`);
      }, policy.repeatMinutes * 60 * 1000);
      previousLevelRef.current = liveLevel;
      return () => window.clearInterval(intervalId);
    }

    previousLevelRef.current = liveLevel;
  }, [liveLevel, liveRiseLevel, criticalAcknowledged]);

  const isAlertRoute = pathname.startsWith("/Pages/Flood_Risk/Alert");

  return (
    <>
      <audio ref={audioRef} src="/FloodAlarm.mp3" preload="auto" />

      {isAlertRoute && liveLevel === "Critical" && !criticalAcknowledged && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl rounded-2xl border-4 border-red-500 bg-white p-6 shadow-2xl">
            <h2 className="text-3xl font-extrabold text-red-700">CRITICAL FLOOD EMERGENCY</h2>
            <p className="mt-3 text-base text-slate-700">
              Severe inundation is expected. Move to higher ground immediately and avoid all flooded routes.
            </p>
            <p className="mt-2 text-sm text-slate-600">This warning stays active until you acknowledge it.</p>
            <button
              type="button"
              onClick={() => setCriticalAcknowledged(true)}
              className="mt-5 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              I am aware - dismiss alert
            </button>
          </div>
        </div>
      )}
    </>
  );
}
