"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Droplets } from "lucide-react";
import Header from "@/app/Header/page";
import Navbar from "../NavBar/Navbar";
import {
  levels,
  levelWarnings,
  safetyGuidelines,
  feetRanges,
  getColor,
  getBadge,
  getActiveGradient,
  type LevelName,
} from "./floodLevelConfig";

// Minimal shape consumed from `/api/flood` records.
interface FloodMeasurement {
  id: number;
  riseLevel: number;
  severity: string;
  firstAffected: string;
  nextAffected?: string;
  floodFeet: number;
  createdAt: string;
}

export default function FloodLevelsPage() {
  // Current live values shown in the header + cards.
  const [currentSeverity, setCurrentSeverity] = useState("");
  const [riseLevel, setRiseLevel] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const previousAlarmSeverityRef = useRef("");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    // Load latest saved reading first, then also as periodic fallback.
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/flood", { cache: "no-store" });
        if (!res.ok) return;
        const data: FloodMeasurement[] = await res.json();
        if (cancelled || data.length === 0) return;
        setCurrentSeverity(data[0].severity);
        setRiseLevel(data[0].riseLevel);
      } catch {
        // Ignore temporary network/API issues; next poll or reconnect will retry.
      }
    };

    const connect = () => {
      if (cancelled) return;
      ws = new WebSocket("ws://localhost:5000");

      ws.onopen = () => {
        // Sync immediately after (re)connect so level cards don't wait for next poll tick.
        void fetchData();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "FLOOD_UPDATE") {
            setCurrentSeverity(msg.data.severity);
            setRiseLevel(msg.data.riseLevel);
          }
        } catch {
          /* ignore malformed payloads */
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        // Pull latest known value while socket is down.
        void fetchData();
        reconnectTimer = setTimeout(connect, 2000);
      };
      ws.onerror = () => ws?.close();
    };

    fetchData();
    connect();

    // Fallback polling keeps UI fresh even if WS disconnects silently.
    const pollTimer = setInterval(fetchData, 5000);

    return () => {
      cancelled = true;
      clearInterval(pollTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();

    // Unlock audio on first user gesture to satisfy browser autoplay policy.
    const unlockAudio = () => {
      const el = audioRef.current;
      if (!el) return;
      el.muted = true;
      el
        .play()
        .then(() => {
          el.pause();
          el.currentTime = 0;
          el.muted = false;
          setAudioReady(true);
          window.removeEventListener("pointerdown", unlockAudio);
          window.removeEventListener("keydown", unlockAudio);
          window.removeEventListener("touchstart", unlockAudio);
        })
        .catch(() => {
          // Keep listeners until browser accepts a gesture event.
        });
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const highRisk = currentSeverity === "Major" || currentSeverity === "Critical";
    if (!highRisk) {
      audio.pause();
      audio.currentTime = 0;
      previousAlarmSeverityRef.current = currentSeverity;
      return;
    }

    // Play once per high-risk transition (no nonstop loop).
    if (previousAlarmSeverityRef.current === currentSeverity) return;

    // If browser already has user activation in this tab, allow immediate playback.
    const browserActivated =
      typeof navigator !== "undefined" &&
      "userActivation" in navigator &&
      Boolean((navigator as Navigator & { userActivation?: { hasBeenActive?: boolean } }).userActivation?.hasBeenActive);
    if (!audioReady && browserActivated) {
      setAudioReady(true);
    }
    if (!audioReady && !browserActivated) return;

    let cleanedUp = false;
    const retryEvents: Array<keyof WindowEventMap> = ["click", "keydown", "touchstart"];

    const tryPlayAlarm = () => {
      if (!audioRef.current) return;
      audioRef.current
        .play()
        .then(() => {
          if (cleanedUp) return;
          previousAlarmSeverityRef.current = currentSeverity;
          retryEvents.forEach((eventName) => window.removeEventListener(eventName, tryPlayAlarm));
        })
        .catch(() => {
          // Keep listeners attached; next interaction will retry.
        });
    };

    tryPlayAlarm();
    retryEvents.forEach((eventName) => window.addEventListener(eventName, tryPlayAlarm, { passive: true }));

    return () => {
      cleanedUp = true;
      retryEvents.forEach((eventName) => window.removeEventListener(eventName, tryPlayAlarm));
    };
  }, [currentSeverity, audioReady]);

  // Resolve all UI blocks from the current level once.
  const activeLevel = levels.find((l) => l.name === currentSeverity)?.name as LevelName | undefined;
  const warning = activeLevel ? levelWarnings[activeLevel] : null;
  const guidelines = activeLevel ? safetyGuidelines[activeLevel] : [];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 text-black overflow-x-hidden text-[15px]">
        <Navbar />
        <audio ref={audioRef} src="/FloodAlarm.mp3" preload="auto" />

        <div className="max-w-[88rem] mx-auto px-4 md:px-5 lg:px-6 py-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-[30px] md:text-[40px] font-extrabold text-blue-900 tracking-tight flex items-center gap-3">
                <Droplets size={32} className="text-blue-600 animate-pulse" />
                Flood Risk Level Monitor
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-lg">
                Live flood level overview and response guidance
              </p>
            </div>
            <div className="inline-flex items-center rounded-xl border border-blue-200 bg-white p-1 shadow-sm">
              <span className="rounded-lg px-4 py-2 text-[14px] font-semibold text-slate-600">
                Overview
              </span>
              <Link
                href="/Pages/Flood_Risk/Alert/Live"
                className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-blue-700"
              >
                Live status (current level only)
              </Link>
            </div>
          </div>

          <p className="mb-6 text-[20px]">
            Current Water Rise Level :
            <span className="ml-2 font-bold text-blue-600 text-[24px]">{riseLevel} mm</span>
          </p>

          {/* Shown before first usable severity arrives from API/websocket. */}
          {!warning && (
            <div className="mb-6 p-4 rounded-lg bg-gray-200 text-gray-800 font-medium shadow flex items-center">
              <span className="mr-3 text-[24px]">📡</span>
              <span>Connecting to flood monitor… severity will appear here when data is received.</span>
            </div>
          )}

          {/* Top status banner: headline + short action text for active level */}
          {warning && (
            <div className={`mb-6 p-5 rounded-lg shadow-lg ${warning.bannerClass}`}>
              <div className="flex items-start gap-3">
                <span className="text-[30px] shrink-0" aria-hidden>
                  {activeLevel === "Normal" ? "✓" : activeLevel === "Critical" || activeLevel === "Major" ? "⚠️" : "ℹ️"}
                </span>
                <div>
                  <p className="text-[24px] font-bold leading-tight">{warning.headline}</p>
                  <p className="mt-2 text-[18px] font-medium opacity-95 leading-snug">{warning.detail}</p>
                  <p className="mt-2 text-[17px] font-semibold opacity-90">
                    Current level: <span className="uppercase tracking-wide">{currentSeverity}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Safety list for only the current live level */}
          {guidelines.length > 0 && (
            <section
              className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm"
              aria-labelledby="safety-guidelines-heading"
            >
              <h2 id="safety-guidelines-heading" className="text-[30px] font-bold text-blue-900 mb-2">
                Safety guidelines
              </h2>
              <p className="text-blue-800 mb-4 text-[18px]">
                Follow these steps for the <strong>{currentSeverity}</strong> level. Adjust as local authorities direct.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-blue-900 text-[18px] leading-relaxed">
                {guidelines.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Always show full level map so users can compare thresholds quickly */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {levels.map((level) => {
              // Active level gets stronger visual treatment so it stands out in the grid.
              const isActive = currentSeverity === level.name;
              return (
                <div
                  key={level.name}
                  id={`level-${level.name.toLowerCase()}`}
                  className={`border-l-4 ${getColor(level.name)}
                    rounded-xl p-6 shadow hover:shadow-lg transition-all duration-300
                    flex flex-col justify-between
                    ${isActive ? `scale-105 ring-2 ring-blue-500 ${getActiveGradient(level.name)}` : "bg-white"}`}
                >
                  <div className="flex items-center mb-4">
                    <span className="text-[30px] mr-3">{level.icon}</span>
                    <h2 className="text-[20px] font-bold">{level.name}</h2>
                    <span className="ml-3 text-[20px] font-bold">{feetRanges[level.name]}</span>
                  </div>

                  {/* Quick color badge for scanning level severity. */}
                  <span className={`px-3 py-1 rounded-full font-semibold mb-3 ${getBadge(level.name)}`}>
                    {level.name}
                  </span>

                  <p className="mb-3 text-gray-700">Threshold: {level.threshold} mm</p>

                  <p className="font-semibold mb-1">First Affected Areas</p>
                  <pre className="whitespace-pre-wrap">{level.firstAffected}</pre>

                  {/* Some levels don't define a next area; hide block when absent. */}
                  {level.nextAffected && (
                    <>
                      <p className="font-semibold mt-3 mb-1">Next Affected</p>
                      <pre className="whitespace-pre-wrap">{level.nextAffected}</pre>
                    </>
                  )}

                  <p className="mt-3 font-semibold text-blue-600">
                    Estimated Flood Depth: {level.floodFeet} ft
                  </p>

                  {/* Active marker inside the matching card only. */}
                  {isActive && (
                    <div className="mt-3 p-2 bg-blue-600 text-white rounded text-center font-bold animate-bounce">
                      CURRENT LEVEL
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
